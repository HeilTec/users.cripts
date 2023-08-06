// ==UserScript==
// @name         ShipSelect
// @namespace    https://github.com/HeilTec/users.cripts/tree/main
// @updateURL    https://github.com/HeilTec/users.cripts/raw/main/Netquel/ShipSelect.user.js
// @downloadURL  https://github.com/HeilTec/users.cripts/raw/main/Netquel/ShipSelect.user.js
// @version      0.6
// @description  Ship manager for Netquel
// @author       HeilTec
// @match        https://netquel.com/
// @sandbox      JavaScript
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {

    'use strict';

    /** @global */
    const builtInShipsList = [ // The `-s must be escaped using \
        `/import netquel1Y2?hw^b!`,
        // 0
        `/import netquel1Y2|2(k?AD`,
        // 75
        `/import netquel1Y2|2(k@o1MsrV8`,
        // 425
        `/import netquel1X|<!Z7-^3?X-7M0R~BCa`,
        // 800
        `/import netquel1X|*FQMp_g8S#;8l%1OK0(K=~g<z#78uD1AE`,
        // 2230
        `/import netquel1X;qG-VkFaqe-@o&j><{qsvJp^%)75twLeGYsw}<|0R`,
        // 3595
        `/import netquel1X_Yuy@4IS8Tc5isN9%EKUUhZ1Pg0AkFW;r+f2~eLXSZU}N$MnZR2E-}`,
        `/import netquel1h5vl>o5!TH9Phrtr27Vw>KnJLo@F(b!=0;JZaLVwZn@=f=elM0jpZ!29PF0Eo$Hoc4tB0vcH6ez\`TF_#X}Y(WcJ?eIn!UZQ13TB@c4j&(0R`,
        `/import netquel1{f}OMb_8RdC)P5rdeuAMMVxcaL!WvgNv>UMO}Wg2x=dZB)?!+V<u8Bv%VYo`,
        `/import netquel1{r~Yl8^+ctRaI5*QgXY>EppPOVoSxAy40m^k<+TAs!Qdi)>Q%`,
    ];

    /** @global */
    const debug = true;

    function myDebug() {
        if (debug) console.debug(...arguments);
    }

    console.info('userscript loaded');

    /** @global */
    const _import = '/import ';

    /** @global */
    const _export = '/export';

    /** @global */
    const _netquel = 'netquel';
    /** @type  {KeyboardEventInit}*/
    const enterEventInit = {key: 'Enter', code: 'Enter'};
    /** @global */
    const enterDown = new KeyboardEvent('keydown', enterEventInit);

    /** @global */
    const enterPress = new KeyboardEvent('keypress', enterEventInit);

    /** @global */
    const enterUp = new KeyboardEvent('keyup', enterEventInit);

    /** @global */
    let shipCode = 'netquel1Y2?hw^b!';

    /** @global */
    let shipList = [... builtInShipsList];

    /** @global */
    let activeCatcher = 0;

    /** @global */
    let selectedShipIndex = -1;

    // application prevents normal keyboard state update - need 'private' values

    /** @global */
    let myShiftKey = false;

    /** @global */
    let myControlKey = false;

    /** @global */
    let myAltKey = false;

    const _shipListKey = 'shipList';
    /** @global */
    let storedShips = GM_getValue(_shipListKey);

    if (Array.isArray(storedShips) && storedShips.length === 10) {
        shipList = storedShips;
    } else {
        GM_setValue(_shipListKey, shipList);
    }

    /** @global */
    const LoadLabel = createLoadButton();
    createSaveButton();
    installKeyboardHook();

    /** Creates a button to load current ship code */
    function createLoadButton() {
        const loadShipDiv = unsafeWindow.document.createElement('div');
        loadShipDiv.style = 'position: absolute; top: 20px; left: 30%;; z-index: 1000';

        const loadShip = unsafeWindow.document.createElement('label');
        loadShip.innerText = `LoadShip ${selectedShipIndex}`;
        loadShipDiv.appendChild(loadShip);

        unsafeWindow.document.body.appendChild(loadShipDiv);

        loadShipDiv.addEventListener('click', _ => {
            PasteShip(shipCode);
        });
        return loadShip;
    }

    /** Creates a button to edit all stored ship codes */
    function createSaveButton() {
        const _newLine = '\n';

        /** @type {HTMLDivElement} */
        const saveShipDiv = unsafeWindow.document.createElement('div');

        /** @type {HTMLLabelElement} */
        const saveShipButton = unsafeWindow.document.createElement('label');

        const enterShips = createShipsTextarea();

        /** @type {HTMLDivElement} */
        const container = unsafeWindow.document.createElement('div');
        container.style.position = 'relative';
        container.style.left = '-160px';
        container.style.display = 'none';
        container.appendChild(enterShips);

        container.appendChild(unsafeWindow.document.createElement('br'));

        /** @type {HTMLButtonElement} */
        const cancelButton = unsafeWindow.document.createElement('button');
        cancelButton.innerText = 'Cancel';
        cancelButton.addEventListener('click', () => {
            container.style.display = 'none';
        });
        container.appendChild(cancelButton);

        /** @type {HTMLButtonElement} */
        const saveButton = unsafeWindow.document.createElement('button');
        saveButton.innerText = 'Save';
        saveButton.addEventListener('click', () => {
            shipList = enterShips.value.split(_newLine);
            GM_setValue(_shipListKey, shipList);
            container.style.display = 'none';
        });
        container.appendChild(saveButton);

        /** @type {HTMLButtonElement} */
        const restoreButton = unsafeWindow.document.createElement('button');
        restoreButton.innerText = 'Restore'
        restoreButton.addEventListener('click', () => {
            shipList = GM_getValue(_shipListKey);
            enterShips.value = shipList.join(_newLine);
        });
        container.appendChild(restoreButton);

        saveShipButton.innerText = 'SaveShip';
        saveShipButton.addEventListener('click', _ => {
            if (container.style.display === 'none') {
                container.style.display = 'block';
                enterShips.value = shipList.join(_newLine);
                enterShips.focus();
            } else {
                container.style.display = 'none';
                shipList = enterShips.value.split(_newLine);
                myDebug(shipList);
            }
        });

        saveShipDiv.style = 'position: absolute; top: 20px; left: 70%; z-index: 1000;';
        saveShipDiv.appendChild(saveShipButton);
        saveShipDiv.appendChild(container);
        unsafeWindow.document.body.appendChild(saveShipDiv);

        function createShipsTextarea() {
            /** @type {HTMLTextAreaElement} */
            const shipsTextarea = unsafeWindow.document.createElement('textarea');

            shipsTextarea.style.color = 'white';
            shipsTextarea.style.backgroundColor = 'black';
            shipsTextarea.rows = 11;
            shipsTextarea.cols = 50;
            // shipsTextarea.classList.add('stylist-style-18');
            return shipsTextarea;
        }
    }

    function HitEnterTwice() {
        setTimeout(() => {
            document.body.dispatchEvent(enterDown);
            document.body.dispatchEvent(enterPress);
        }, 0);
        setTimeout(() => {
            document.body.dispatchEvent(enterUp);
        }, 17);
        setTimeout(() => {
            document.body.dispatchEvent(enterDown);
            document.body.dispatchEvent(enterPress);
        }, 34);
        setTimeout(() => {
            document.dispatchEvent(enterUp);
        }, 51);
    }

    /**
     * @param {String} command copied to chatInput field if present
     */
    function pasteCommandString(command) {
        const foundChatBox = unsafeWindow.document.getElementById('chat');
        const chatInput = foundChatBox?.querySelector('input[name=message]');
        // console.info('chatInput', chatInput);
        if (chatInput !== undefined) {
            chatInput.value = command;
            HitEnterTwice();
        }
        // else ignore
    }

    /** @param {string} shipCode Copy shipCode to chat Input field */
    function PasteShip(shipCode) {
        pasteCommandString(shipCode.indexOf(_import) === 0 ? shipCode : _import + shipCode);
    }

    /**
     *
     * @returns {String}
     */
    function readCommandString() {
        /** @type {HTMLElement} foundChatBox */
        const foundChatBox = unsafeWindow.document.getElementById('chat');
        const chatInput = foundChatBox?.querySelector('input[name=message]');
        if (chatInput !== undefined) {
            return chatInput.value;
        }
        return '';
    }

    /**
     *
     * @param {?Function} cb callback
     * @returns undefined
     */
    function catchShipCodeFromServerAnswer(cb){
        const foundChatBox = unsafeWindow.document.getElementById('chat');
        const paragraphs = foundChatBox?.querySelectorAll('p');
        if (paragraphs === undefined) return;
        let pIndex = paragraphs.length - 1;
        while (pIndex >= 0) {
            const paragraph = paragraphs[pIndex];
            const spans = paragraph.querySelectorAll('span');
            if (spans[0].textContent === 'Server') {
                const fromServer = spans[2].textContent;
                if (fromServer.indexOf(_netquel) === 0) {
                    shipCode = fromServer;
                    if (cb) cb();
                    return;
                }
            }
            pIndex--;
        }
        activeCatcher = setTimeout(catchShipCodeFromServerAnswer, 36, cb);
    }

    function installKeyboardHook() {
        unsafeWindow.document.body.addEventListener('keyup',
            (ev) => {
                myDebug('keyup: ', Date.now(), ev.key, ev.code, '\n', `MyShiftKey: ${myShiftKey} MyControlKey ${myControlKey} MyAltKey ${myAltKey}`);
                if (ev.code.slice(0, 5) === 'Shift') myShiftKey = false;
                if (ev.code.slice(0, 7) === 'Control') myControlKey = false;
                if (ev.code.slice(0, 3) === 'Alt') myAltKey = false;
            }
        );

        unsafeWindow.document.body.addEventListener('keydown',
            /**
             * Keyboard event handler
             * @param {KeyboardEvent} ev Event
             */
            (ev) => {
                myDebug('keydown: ', Date.now(), ev.key, ev.code, '\n', `MyShiftKey: ${myShiftKey} MyControlKey ${myControlKey} MyAltKey ${myAltKey}`);
                if (ev.code.slice(0, 5) === 'Shift') myShiftKey = true;
                if (ev.code.slice(0, 7) === 'Control') myControlKey = true;
                if (ev.code.slice(0, 3) === 'Alt') myAltKey = true;

                if (ev.code.indexOf('Numpad') === 0) {

                    const numpadID = (ev.code.substring(6, 7));
                    selectedShipIndex = parseInt(numpadID);
                    if (!isNaN(selectedShipIndex)) { // It is a number
                        LoadLabel.innerText = `LoadShip ${selectedShipIndex}`;
                        if (myAltKey) {
                            const commandString = readCommandString();
                            if (commandString.indexOf(_netquel) >= 0) {
                                shipList[selectedShipIndex] = commandString;
                            }
                        } else {
                            shipCode = shipList[selectedShipIndex];
                            PasteShip(shipCode);
                        }
                    } else { // It is a special char
                        switch (numpadID) {
                            case 'D': // (NumpadDivide) UpdateCurrent ship
                                pasteCommandString(_export);
                                if (activeCatcher !== 0) clearTimeout(activeCatcher);
                                activeCatcher = setTimeout(catchShipCodeFromServerAnswer, 36, _ => {
                                    shipList[selectedShipIndex] = shipCode;
                                });
                                break;

                            case 'M': // (NumpadMultiply) 
                                PasteShip(shipCode);
                                break;

                            default:
                                break;
                        }
                    }
                }
            }
        );
    }
})();
