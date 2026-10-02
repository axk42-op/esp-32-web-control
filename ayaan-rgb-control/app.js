const MQTT_BROKER =
    "wss://branches-solved-attorney-continuously.trycloudflare.com";

const MQTT_USERNAME = "ayaan";
const MQTT_PASSWORD = "Kichu@040414";

const COMMAND_TOPIC =
    "ayaanglobals/esp32s3/001/command";

const STATE_TOPIC =
    "ayaanglobals/esp32s3/001/state";

const STATUS_TOPIC =
    "ayaanglobals/esp32s3/001/status";


const connectionStatus =
    document.getElementById("connectionStatus");

const colorPicker =
    document.getElementById("colorPicker");

const colorPreview =
    document.getElementById("colorPreview");

const brightness =
    document.getElementById("brightness");

const speed =
    document.getElementById("speed");

const brightnessValue =
    document.getElementById("brightnessValue");

const speedValue =
    document.getElementById("speedValue");


function setConnectionStatus(online) {

    if (online) {

        connectionStatus.textContent = "● Online";

        connectionStatus.classList.remove("offline");
        connectionStatus.classList.add("online");

    } else {

        connectionStatus.textContent = "● Offline";

        connectionStatus.classList.remove("online");
        connectionStatus.classList.add("offline");
    }
}


const client = mqtt.connect(MQTT_BROKER, {

    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,

    reconnectPeriod: 3000,
    connectTimeout: 10000
});


client.on("connect", () => {

    console.log("MQTT connected");

    setConnectionStatus(true);

    client.subscribe(STATE_TOPIC);
    client.subscribe(STATUS_TOPIC);

});


client.on("reconnect", () => {

    console.log("MQTT reconnecting...");

    setConnectionStatus(false);

});


client.on("close", () => {

    setConnectionStatus(false);

});


client.on("error", error => {

    console.error("MQTT error:", error);

    setConnectionStatus(false);

});


client.on("message", (topic, message) => {

    const data = message.toString();

    console.log(topic, data);


    if (topic === STATUS_TOPIC) {

        if (data === "online") {
            setConnectionStatus(true);
        }

        if (data === "offline") {
            setConnectionStatus(false);
        }

        return;
    }


    if (topic === STATE_TOPIC) {

        try {

            const state = JSON.parse(data);

            updateState(state);

        } catch (error) {

            console.error(
                "Invalid state JSON:",
                error
            );

        }

    }

});


function publishCommand(command) {

    if (!client.connected) {

        console.warn(
            "MQTT is not connected"
        );

        return;
    }


    client.publish(
        COMMAND_TOPIC,
        command
    );


    console.log(
        "Command:",
        command
    );

}


function sendColor(r, g, b) {

    publishCommand(
        JSON.stringify({
            action: "color",
            r: r,
            g: g,
            b: b
        })
    );

}


function sendEffect(effect) {

    publishCommand(
        JSON.stringify({
            action: "effect",
            value: effect
        })
    );

}


function sendBrightness(value) {

    publishCommand(
        JSON.stringify({
            action: "brightness",
            value: Number(value)
        })
    );

}


function sendSpeed(value) {

    publishCommand(
        JSON.stringify({
            action: "speed",
            value: Number(value)
        })
    );

}


function sendOff() {

    publishCommand(
        JSON.stringify({
            action: "off"
        })
    );

}


function hexToRGB(hex) {

    const value = hex.replace("#", "");

    return {

        r: parseInt(
            value.substring(0, 2),
            16
        ),

        g: parseInt(
            value.substring(2, 4),
            16
        ),

        b: parseInt(
            value.substring(4, 6),
            16
        )

    };

}


function updateColorPreview() {

    colorPreview.style.background =
        colorPicker.value;

    colorPreview.style.boxShadow =
        "0 0 35px " + colorPicker.value;

}


colorPicker.addEventListener(
    "input",
    updateColorPreview
);


document
    .getElementById("applyColor")
    .addEventListener(
        "click",
        () => {

            const rgb =
                hexToRGB(colorPicker.value);

            sendColor(
                rgb.r,
                rgb.g,
                rgb.b
            );

        }
    );


document
    .querySelectorAll(".color-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (
                    button.dataset.off === "true"
                ) {

                    sendOff();

                    return;
                }


                const values =
                    button.dataset.color
                        .split(",")
                        .map(Number);


                sendColor(
                    values[0],
                    values[1],
                    values[2]
                );

            }
        );

    });


document
    .querySelectorAll("[data-effect]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                sendEffect(
                    button.dataset.effect
                );

            }
        );

    });


brightness.addEventListener(
    "input",
    () => {

        brightnessValue.textContent =
            brightness.value + "%";

    }
);


speed.addEventListener(
    "input",
    () => {

        speedValue.textContent =
            speed.value + "%";

    }
);


document
    .getElementById("applyBrightness")
    .addEventListener(
        "click",
        () => {

            sendBrightness(
                brightness.value
            );

        }
    );


document
    .getElementById("applySpeed")
    .addEventListener(
        "click",
        () => {

            sendSpeed(
                speed.value
            );

        }
    );


function updateState(state) {

    if (state.effect !== undefined) {

        document
            .getElementById("stateEffect")
            .textContent =
            state.effect;

    }


    if (
        state.r !== undefined &&
        state.g !== undefined &&
        state.b !== undefined
    ) {

        document
            .getElementById("stateRGB")
            .textContent =
            state.r +
            ", " +
            state.g +
            ", " +
            state.b;


        const hex =
            "#" +
            [state.r, state.g, state.b]
                .map(value =>
                    Number(value)
                        .toString(16)
                        .padStart(2, "0")
                )
                .join("");


        colorPicker.value = hex;

        updateColorPreview();

    }


    if (state.brightness !== undefined) {

        brightness.value =
            state.brightness;

        brightnessValue.textContent =
            state.brightness + "%";


        document
            .getElementById("stateBrightness")
            .textContent =
            state.brightness + "%";

    }


    if (state.speed !== undefined) {

        speed.value =
            state.speed;

        speedValue.textContent =
            state.speed + "%";


        document
            .getElementById("stateSpeed")
            .textContent =
            state.speed + "%";

    }


    if (state.ip !== undefined) {

        document
            .getElementById("stateIP")
            .textContent =
            state.ip;

    }


    if (state.wifi_rssi !== undefined) {

        document
            .getElementById("stateRSSI")
            .textContent =
            state.wifi_rssi + " dBm";

    }

}


updateColorPreview();
