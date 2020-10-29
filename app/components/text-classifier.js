import Component from '@glimmer/component';
import { action} from '@ember/object';
import { tracked} from '@glimmer/tracking';
import { dropTask } from 'ember-concurrency-decorators';
import { timeout } from 'ember-concurrency';
import * as tf from "@tensorflow/tfjs";
import fetch from 'fetch'

const PAD_INDEX = 0;  // Index of the padding character.
const OOV_INDEX = 2;  // Index fo the OOV character.

export default class TextClassifierComponent extends Component {
  @tracked
  text = "die hard mario fan and i loved this game br br this game starts slightly boring but trust me it's worth it as soon as you start your hooked the levels are fun and exiting they will hook you OOV your mind turns to mush i'm not kidding this game is also orchestrated and is beautifully done br br to keep this spoiler free i have to keep my mouth shut about details but please try this game it'll be worth it br br story 9 9 action 10 1 it's that good OOV 10 attention OOV 10 average 10";

  @tracked score = "";

  size = 224;
  normalizationOffset = tf.scalar(255);

  constructor() {
    super(...arguments);

    this.init();
  }

  async init() {
    await this.loadModel.perform();
    await this.predict.perform(this.text);
  }

  get loadedModel() {
    return this.loadModel.lastSuccessful?.value;
  }

  get metadata() {
    return this.loadedModel.metadata
  }

  get model() {
    return this.loadedModel.model
  }

  @action
  positive() {
    this.text = "die hard mario fan and i loved this game br br this game starts slightly boring but trust me it's worth it as soon as you start your hooked the levels are fun and exiting they will hook you OOV your mind turns to mush i'm not kidding this game is also orchestrated and is beautifully done br br to keep this spoiler free i have to keep my mouth shut about details but please try this game it'll be worth it br br story 9 9 action 10 1 it's that good OOV 10 attention OOV 10 average 10"
  }

  @action
  negative() {
    this.text = "the mother in this movie is reckless with her children to the point of neglect i wish i wasn't so angry about her and her actions because i would have otherwise enjoyed the flick what a number she was take my advise and fast forward through everything you see her do until the end also is anyone else getting sick of watching movies that are filmed so dark anymore one can hardly see what is being filmed as an audience we are impossibly involved with the actions on the screen so then why the hell can't we have night vision"
  }

  @action
  updateText() {
    this.predict.perform(this.text);
  }

  @dropTask
  *loadModel() {
    const baseUrl = 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1'
    const model = yield tf.loadLayersModel(`${baseUrl}/model.json`);

    const metadataJson = yield fetch(`${baseUrl}/metadata.json`);
    const metadata = yield metadataJson.json();

    return { model, metadata }
  }

  @dropTask
  *predict(text) {
    yield timeout(1000)

    // Convert to lower case and remove all punctuations.
    const inputText =
        text.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ');

    // Convert the words to a sequence of word indices.
    const sequence = inputText.map(word => {
      let wordIndex = this.metadata.word_index[word] + this.metadata.index_from;
      if (wordIndex > this.metadata.vocabulary_size) {
        wordIndex = OOV_INDEX;
      }
      return wordIndex;
    });

    // Perform truncation and padding.
    const paddedSequence = this.padSequences([sequence], this.metadata.max_len);
    const input = tf.tensor2d(paddedSequence, [1, this.metadata.max_len]);

    const beginMs = performance.now();
    const predictOut = this.model.predict(input);
    const score = predictOut.dataSync()[0];
    predictOut.dispose();
    const endMs = performance.now();

    this.score = score;

    console.log({score: score, elapsed: (endMs - beginMs)});
  }

  padSequences(sequences, maxLen, padding = 'pre', truncating = 'pre', value = PAD_INDEX) {
    // TODO(cais): This perhaps should be refined and moved into tfjs-preproc.
    return sequences.map(seq => {
      // Perform truncation.
      if (seq.length > maxLen) {
        if (truncating === 'pre') {
          seq.splice(0, seq.length - maxLen);
        } else {
          seq.splice(maxLen, seq.length - maxLen);
        }
      }

      // Perform padding.
      if (seq.length < maxLen) {
        const pad = [];
        for (let i = 0; i < maxLen - seq.length; ++i) {
          pad.push(value);
        }
        if (padding === 'pre') {
          seq = pad.concat(seq);
        } else {
          seq = seq.concat(pad);
        }
      }

      return seq;
    });
  }

}


