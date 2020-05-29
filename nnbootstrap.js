import { MnistData } from './data';
import * as model from './model';

async function load() {
    let data = new MnistData();
    await data.load();
    return data
}

async function train(data) {
    await model.train(data, console.log);
}

export async function bootstrap() {
    let data = await load();
    await train(data);
}
