import { Vibrator } from "@zos/sensor";

const vibrator = new Vibrator();

export function vibrateError() {
    vibrator.start();
}