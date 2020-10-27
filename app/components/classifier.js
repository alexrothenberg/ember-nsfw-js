import Component from '@glimmer/component';
import { action} from '@ember/object';
import { tracked} from '@glimmer/tracking';
import fetch from 'fetch';

export default class ClassifierComponent extends Component {
  @tracked
  predictions = [];

  @action
  async classify({target}) {
    this.predictions = await this.args.model.classify(target);
  }

}
