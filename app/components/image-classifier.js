import Component from '@glimmer/component';
import { action} from '@ember/object';
import { tracked} from '@glimmer/tracking';
import { dropTask } from 'ember-concurrency-decorators';
import * as tf from "@tensorflow/tfjs";

export default class ClassifierComponent extends Component {
  @tracked
  predictions = [];

  size = 224;
  normalizationOffset = tf.scalar(255);

  constructor() {
    super(...arguments);

    this.loadModel.perform();
  }

  get loadedModel() {
    return this.loadModel.lastSuccessful?.value;
  }

  get endpoints() {
    return this.loadedModel.endpoints
  }

  get model() {
    return this.loadedModel.model
  }


  @dropTask
  *loadModel() {
    const model = yield tf.loadLayersModel('/tfjs_quant_nsfw_mobilenet/model.json')
    const endpoints = model.layers.mapBy('name');

    // Warmup the model.
    const result = tf.tidy(() =>
      model.predict(tf.zeros([1, this.size, this.size, 3]))
    );
    yield result.data();
    result.dispose();

    return { model, endpoints }
  }

  @action
  async classify({target}) {
    const logits = this.infer(target);

    const topk = 5;
    const classes = await this.getTopKClasses(logits, topk);

    logits.dispose();

    this.predictions = classes;
  }

  infer(img) {
    return tf.tidy(() => {
      if (!(img instanceof tf.Tensor)) {
        img = tf.browser.fromPixels(img);
      }

      // Normalize the image from [0, 255] to [0, 1].
      const normalized = img
        .toFloat()
        .div(this.normalizationOffset);

      // Resize the image to
      let resized = normalized;
      const size = this.size
      // check width and height if resize needed
      if (img.shape[0] !== size || img.shape[1] !== size) {
        const alignCorners = true;
        resized = tf.image.resizeBilinear(
          normalized,
          [size, size],
          alignCorners
        );
      }

      // Reshape to a single-element batch so we can pass it to predict.
      const batched = resized.reshape([1, size, size, 3]);

      return this.model.predict(batched)
    });
  }

  async getTopKClasses(logits, topK) {
    // I guess this is baked into the model maybe?
    const IMAGE_TYPES = {
      0: 'Drawing',
      1: 'Hentai',
      2: 'Neutral',
      3: 'Porn',
      4: 'Sexy'
    }

    const values = Array.from(await logits.data());
    return values.map((value, index)=> {
      return {
        className: IMAGE_TYPES[index],
        probability: value
      }
    }).sortBy('probability').reverse();
  }
}
