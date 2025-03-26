import { getCharacterId } from "./Loader";
import * as Signals from './Signals.js';

export function handleDisplayNameChange(object, actualState) {
    if (actualState.dn != undefined) {
        object.userData.state.dn = actualState.dn;
    }
    if (actualState.cbl != undefined) {
        object.userData.state.cbl = actualState.cbl;
    }
    if (actualState.ma != undefined) {
        object.userData.state.ma = actualState.ma;
    }
    if (actualState.en != undefined) {
        object.userData.state.en = actualState.en;
    }

    if (object.userData.uuid == getCharacterId()) {
        Signals.publish('displayNameChange', object);
    }
}