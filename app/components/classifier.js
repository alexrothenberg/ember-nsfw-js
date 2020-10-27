import Component from '@glimmer/component';
import { action} from '@ember/object';
import { tracked} from '@glimmer/tracking';
import { dropTask } from 'ember-concurrency-decorators';
import {load}  from "nsfwjs";

export default class ClassifierComponent extends Component {
  @tracked
  predictions = [];

  constructor() {
    super(...arguments);

    this.loadModel.perform();
  }

  @dropTask
  *loadModel() {
    return yield load('/tfjs_quant_nsfw_mobilenet/');
  }

  @action
  async classify({target}) {
    const model = this.loadModel.lastSuccessful.value
    this.predictions = await model.classify(target);
  }

}
