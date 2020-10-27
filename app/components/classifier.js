import Component from '@glimmer/component';
import { action} from '@ember/object';
import { tracked} from '@glimmer/tracking';
import fetch from 'fetch';

export default class ClassifierComponent extends Component {
  @tracked
  predictions = [];

  async urlToFile(imageUrl) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new File([blob], 'image.jpg', {type: blob.type});
  }

  @action
  async classify({target}) {
    // const imgFile = await this.urlToFile('https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Alex_Morgan_May19.jpg/440px-Alex_Morgan_May19.jpg')
    this.predictions = await this.args.model.classify(target);
    console.log(this.predictions)
  }

}
