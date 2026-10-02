const MQTT_BROKER =
    "wss://jackson-aging-editorials-electro.trycloudflare.com/mqtt";

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

const connectionDot =
    document.getElementById("connectionDot");

const statusBadge =
    document.getElementById("statusBadge");

const colorPicker =
    document.getElementById("colorPicker");

const colorPreview =
    document.getElementById("colorPreview");

const orbGlow =
    document.getElementById("orbGlow");

const brightness =
    document.getElementById("brightness");

const speed =
    document.getElementById("speed");

const brightnessValue =
    document.getElementById("brightnessValue");

const speedValue =
    document.getElementById("speedValue");

const colorValue =
    document.getElementById("colorValue");

const rgbValue =
    document.getElementById("rgbValue");

const hexValue =
    document.getElementById("hexValue");

const heroEffect =
    document.getElementById("heroEffect");

const heroRGB =
    document.getElementById("heroRGB");


/* =========================
   CONNECTION STATUS
========================= */

function setConnectionStatus(online) {

    if (online) {

        connectionStatus.textContent = "● Online";

        connectionStatus.classList.remove("offline");
        connectionStatus.classList.add("online");

        if (connectionDot) {
            connectionDot.classList.add("online");
        }

        if (statusBadge) {
            statusBadge.textContent = "ONLINE";
            statusBadge.classList.add("live");
        }

    } else {

        connectionStatus.textContent = "● Offline";

        connectionStatus.classList.remove("online");
        connectionStatus.classList.add("offline");

        if (connectionDot) {
            connectionDot.classList.remove("online");
        }

        if (statusBadge) {
            statusBadge.textContent = "OFFLINE";
            statusBadge.classList.remove("live");
        }
    }
}


/* =========================
   MQTT CONNECTION
========================= */

const client = mqtt.connect(MQTT_BROKER, {

    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,

    reconnectPeriod: 3000,
    connectTimeout: 10000,

    protocolVersion: 4,

    clean: true
});


client.on("connect", () => {

    console.log("MQTT connected");

    setConnectionStatus(true);

    client.subscribe(
        STATE_TOPIC,
        error => {
            if (error) {
                console.error(
                    "STATE subscribe error:",
                    error
                );
            }
        }
    );

    client.subscribe(
        STATUS_TOPIC,
        error => {
            if (error) {
                console.error(
                    "STATUS subscribe error:",
                    error
                );
            }
        }
    );

});


client.on("reconnect", () => {

    console.log("MQTT reconnecting...");

    setConnectionStatus(false);

});


client.on("close", () => {

    console.log("MQTT connection closed");

    setConnectionStatus(false);

});


client.on("error", error => {

    console.error(
        "MQTT error:",
        error
    );

    setConnectionStatus(false);

});


/* =========================
   MQTT MESSAGES
========================= */

client.on("message", (topic, message) => {

    const data =
        message.toString();

    console.log(
        topic,
        data
    );


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

            const state =
                JSON.parse(data);

            updateState(state);

        } catch (error) {

            console.error(
                "Invalid state JSON:",
                error
            );

        }
    }

});


/* =========================
   PUBLISH COMMAND
========================= */

function publishCommand(command) {

    if (!client.connected) {

        console.warn(
            "MQTT is not connected"
        );

        showToast("MQTT OFFLINE");

        return;
    }


    client.publish(
        COMMAND_TOPIC,
        command,
        {
            qos: 0,
            retain: false
        },
        error => {

            if (error) {

                console.error(
                    "Publish error:",
                    error
                );

                showToast("COMMAND FAILED");

                return;
            }

            console.log(
                "Command:",
                command
            );
        }
    );
}


/* =========================
   COMMANDS
========================= */

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


/* =========================
   COLOR HELPERS
========================= */

function hexToRGB(hex) {

    const value =
        hex.replace("#", "");

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


function rgbToHex(r, g, b) {

    return "#" +
        [r, g, b]
            .map(value =>
                Number(value)
                    .toString(16)
                    .padStart(2, "0")
            )
            .join("");
}


/* =========================
   COLOR PREVIEW
========================= */

function updateColorPreview() {

    if (!colorPicker ||
        !colorPreview) {

        return;
    }


    const hex =
        colorPicker.value;


    colorPreview.style.background =
        hex;


    colorPreview.style.boxShadow =
        `inset -18px -22px 40px rgba(0,0,0,.28),
         inset 12px 10px 28px rgba(255,255,255,.12),
         0 0 35px ${hex}`;


    if (orbGlow) {

        orbGlow.style.background =
            hex;
    }


    if (colorValue) {

        colorValue.textContent =
            hex.toUpperCase();
    }


    if (hexValue) {

        hexValue.textContent =
            hex.toUpperCase();
    }


    const rgb =
        hexToRGB(hex);


    if (rgbValue) {

        rgbValue.textContent =
            `${rgb.r} / ${rgb.g} / ${rgb.b}`;
    }


    if (heroRGB) {

        heroRGB.textContent =
            `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    }
}


/* =========================
   EFFECT SELECTION
========================= */

function selectEffectButton(effect) {

    document
        .querySelectorAll("[data-effect]")
        .forEach(button => {

            button.classList.toggle(
                "selected",
                button.dataset.effect === effect
            );

        });


    if (heroEffect) {

        heroEffect.textContent =
            effect;
    }


    const stateEffect =
        document.getElementById("stateEffect");

    if (stateEffect) {

        stateEffect.textContent =
            effect;
    }
}


/* =========================
   TOAST
========================= */

function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) return;


    toast.textContent =
        message;


    toast.classList.add("show");


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 1600);
}


/* =========================
   COLOR PICKER
========================= */

if (colorPicker) {

    colorPicker.addEventListener(
        "input",
        updateColorPreview
    );

}


/* =========================
   SET COLOR
========================= */

const applyColor =
    document.getElementById("applyColor");


if (applyColor) {

    applyColor.addEventListener(
        "click",
        () => {

            const rgb =
                hexToRGB(
                    colorPicker.value
                );


            sendColor(
                rgb.r,
                rgb.g,
                rgb.b
            );


            selectEffectButton(
                "SOLID"
            );


            showToast(
                "COLOUR SENT"
            );

        }
    );
}


/* =========================
   QUICK COLORS

   IMPORTANT:
   HTML uses .swatch
========================= */

document
    .querySelectorAll(".swatch")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                /* OFF */

                if (
                    button.dataset.off === "true"
                ) {

                    sendOff();


                    if (colorPicker) {

                        colorPicker.value =
                            "#000000";

                        updateColorPreview();
                    }


                    selectEffectButton(
                        "OFF"
                    );


                    showToast(
                        "LED OFF"
                    );


                    return;
                }


                /* COLOR */

                const values =
                    button.dataset.color
                        .split(",")
                        .map(Number);


                if (colorPicker) {

                    colorPicker.value =
                        rgbToHex(
                            values[0],
                            values[1],
                            values[2]
                        );


                    updateColorPreview();
                }


                sendColor(
                    values[0],
                    values[1],
                    values[2]
                );


                selectEffectButton(
                    "SOLID"
                );


                showToast(
                    "COLOUR SENT"
                );

            }
        );

    });


/* =========================
   EFFECT BUTTONS
========================= */

document
    .querySelectorAll("[data-effect]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const effect =
                    button.dataset.effect;


                sendEffect(
                    effect
                );


                selectEffectButton(
                    effect
                );


                showToast(
                    effect + " SENT"
                );

            }
        );

    });


/* =========================
   BRIGHTNESS SLIDER
========================= */

if (brightness) {

    brightness.addEventListener(
        "input",
        () => {

            if (brightnessValue) {

                brightnessValue.textContent =
                    brightness.value + "%";
            }

        }
    );

}


/* =========================
   SPEED SLIDER
========================= */

if (speed) {

    speed.addEventListener(
        "input",
        () => {

            if (speedValue) {

                speedValue.textContent =
                    speed.value + "%";
            }

        }
    );

}


/* =========================
   APPLY BRIGHTNESS
========================= */

const applyBrightness =
    document.getElementById(
        "applyBrightness"
    );


if (applyBrightness) {

    applyBrightness.addEventListener(
        "click",
        () => {

            sendBrightness(
                brightness.value
            );


            showToast(
                `BRIGHTNESS ${brightness.value}%`
            );

        }
    );

}


/* =========================
   APPLY SPEED
========================= */

const applySpeed =
    document.getElementById(
        "applySpeed"
    );


if (applySpeed) {

    applySpeed.addEventListener(
        "click",
        () => {

            sendSpeed(
                speed.value
            );


            showToast(
                `SPEED ${speed.value}%`
            );

        }
    );

}


/* =========================
   DEVICE STATE
========================= */

function updateState(state) {

    /* EFFECT */

    if (
        state.effect !== undefined
    ) {

        const stateEffect =
            document.getElementById(
                "stateEffect"
            );


        if (stateEffect) {

            stateEffect.textContent =
                state.effect;
        }


        selectEffectButton(
            state.effect
        );
    }


    /* RGB */

    if (
        state.r !== undefined &&
        state.g !== undefined &&
        state.b !== undefined
    ) {

        const stateRGB =
            document.getElementById(
                "stateRGB"
            );


        if (stateRGB) {

            stateRGB.textContent =
                `${state.r}, ${state.g}, ${state.b}`;
        }


        const hex =
            rgbToHex(
                state.r,
                state.g,
                state.b
            );


        if (colorPicker) {

            colorPicker.value =
                hex;

            updateColorPreview();
        }
    }


    /* BRIGHTNESS */

    if (
        state.brightness !== undefined
    ) {

        if (brightness) {

            brightness.value =
                state.brightness;
        }


        if (brightnessValue) {

            brightnessValue.textContent =
                state.brightness + "%";
        }


        const stateBrightness =
            document.getElementById(
                "stateBrightness"
            );


        if (stateBrightness) {

            stateBrightness.textContent =
                state.brightness + "%";
        }
    }


    /* SPEED */

    if (
        state.speed !== undefined
    ) {

        if (speed) {

            speed.value =
                state.speed;
        }


        if (speedValue) {

            speedValue.textContent =
                state.speed + "%";
        }


        const stateSpeed =
            document.getElementById(
                "stateSpeed"
            );


        if (stateSpeed) {

            stateSpeed.textContent =
                state.speed + "%";
        }
    }


    /* IP */

    if (
        state.ip !== undefined
    ) {

        const stateIP =
            document.getElementById(
                "stateIP"
            );


        if (stateIP) {

            stateIP.textContent =
                state.ip;
        }
    }


    /* RSSI */

    if (
        state.wifi_rssi !== undefined
    ) {

        const stateRSSI =
            document.getElementById(
                "stateRSSI"
            );


        if (stateRSSI) {

            stateRSSI.textContent =
                state.wifi_rssi + " dBm";
        }
    }
}


/* =========================
   INITIAL UI
========================= */

setConnectionStatus(false);

updateColorPreview();
