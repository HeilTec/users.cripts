// ==UserScript==
// @name         ShipSelect
// @namespace    https://github.com/HeilTec/users.cripts/tree/main
// @updateURL    https://github.com/HeilTec/users.cripts/raw/main/Netquel/ShipSelect.user.js
// @downloadURL  https://github.com/HeilTec/users.cripts/raw/main/Netquel/ShipSelect.user.js
// @version      0.3
// @description  Ship manager for Netquel
// @author       HeilTec
// @match        https://netquel.com/
// @sandbox      JavaScript
// @grant        unsafeWindow
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
    ]

    /** @global */
    const _matchChatBox = 'div.input[name="message"]';
    console.info('userscript loaded');

    /** @global */
    const _import = '/import ';

    /** @global */
    const _export = '/export';

    /** @global */
    const _netquel = 'netquel';

    /** @global */
    const enterDown = new KeyboardEvent('keydown', {'keyCode':13, 'which':13});

    /** @global */
    const enterPress = new KeyboardEvent('keypress', {'keyCode':13, 'which':13});

    /** @global */
    const enterUp = new KeyboardEvent('keyup', {'keyCode':13, 'which':13});

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

    createLoadButton();
    createSaveButton();
    installKeyboardHook();

    /** Creates a button to load current ship code */
    function createLoadButton() {
        const loadShipDiv = unsafeWindow.document.createElement('div');
        loadShipDiv.style = 'position: absolute; top: 20px; left: 30%;; z-index: 1000';

        const loadShip = unsafeWindow.document.createElement('label');
        loadShip.innerText = 'LoadShip';
        loadShipDiv.appendChild(loadShip);

        unsafeWindow.document.body.appendChild(loadShipDiv);

        loadShipDiv.addEventListener('click', _ => {
            PasteShip(shipCode);
        });
    }

    /** Creates a button to edit all stored ship codes */
    function createSaveButton() {
        const _newLine = '\r\n';
        const saveShipDiv = unsafeWindow.document.createElement('div');
        const saveShipButton = unsafeWindow.document.createElement('label');
        const enterShips = createShipsTextarea();

        saveShipButton.innerText = 'SaveShip';
        saveShipButton.addEventListener('click', _ => {
            if (enterShips.style.display === 'none') {
                enterShips.style.display = 'block';
                enterShips.textContent = shipList.join(_newLine);
                enterShips.focus();
            } else {
                enterShips.style.display = 'none';
                shipList = enterShips.textContent.split(_newLine);
                console.debug(shipList);
            }
        });

        saveShipDiv.style = 'position: absolute; top: 20px; left: 70%; z-index: 1000;';
        saveShipDiv.appendChild(saveShipButton);
        saveShipDiv.appendChild(enterShips);
        unsafeWindow.document.body.appendChild(saveShipDiv);

        function createShipsTextarea() {
            const enterShips = unsafeWindow.document.createElement('textarea');
            enterShips.style.position = 'relative';
            enterShips.style.left = '-160px';
            enterShips.style.color = 'white';
            enterShips.style.backgroundColor = 'black';
            enterShips.style.display = 'none';
            enterShips.rows = 11;
            enterShips.cols = 50;
            enterShips.classList.add('stylist-style-18');
            return enterShips;
        }
    }

    function HitEnterTwice() {
        setTimeout(() => {
            unsafeWindow.document.body.dispatchEvent(enterDown);
            unsafeWindow.document.body.dispatchEvent(enterPress);
        }, 0);
        setTimeout(() => {
            unsafeWindow.document.body.dispatchEvent(enterUp);
        }, 17);
        setTimeout(() => {
            unsafeWindow.document.body.dispatchEvent(enterDown);
            unsafeWindow.document.body.dispatchEvent(enterPress);
        }, 34);
        setTimeout(() => {
            unsafeWindow.document.dispatchEvent(enterUp);
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
     * @returns
     */
    function catchShipCodeFromServerAnswer(cb){
        const foundChatBox = unsafeWindow.document.getElementById('chat');
        const paragraphs = foundChatBox.querySelectorAll('p');
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
                if (ev.key === 'shift') myShiftKey = false;
                if (ev.key === 'Control') myControlKey = false;
            }
        );

        unsafeWindow.document.body.addEventListener('keydown',
            /**
             * Keyboard event handler
             * @param {KeyboardEvent} ev Event
             */
            (ev) => {
                if (ev.key === 'shift') myShiftKey = false;
                if (ev.key === 'Control') myControlKey = false;

                if (ev.code.indexOf('Numpad') === 0) {

                    const numpadID = (ev.code.substring(6, 7));
                    selectedShipIndex = parseInt(numpadID);
                    if (!isNaN(selectedShipIndex)) { // It is a number
                        if (myShiftKey) {
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
                            case '/': // UpdateCurrent ship
                                pasteCommandString(_export);
                                if (activeCatcher !== 0) clearTimeout(activeCatcher);
                                activeCatcher = setTimeout(catchShipCodeFromServerAnswer, 36, _ => {
                                    shipList[selectedShipIndex] = shipCode;
                                });
                                break;

                            case '*':
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
