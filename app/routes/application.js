import Route from '@ember/routing/route';
import * as nsfwjs from "nsfwjs";

export default class ApplicationRoute extends Route {
  model() {
    return nsfwjs.load('/tfjs_quant_nsfw_mobilenet/');
  }
}
