import {createHash} from "crypto";

const sha256 = (text: string) => {
    const hash = createHash('sha256');
    hash.update(text);
    return hash.digest('hex')
}

export {sha256}