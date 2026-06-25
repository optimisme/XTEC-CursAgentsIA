document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const powerSwitch = document.getElementById('powerSwitch');
    const calculatorBody = document.querySelector('.calculator-body');

    let currentValue = '0';
    let previousValue = null;
    let operator = null;
    let waitingForOperand = false;
    let justEvaluated = false;

    const calculator = {
        on: true,

        display(value) {
            let displayValue = String(value);
            if (displayValue.length > 12) {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    displayValue = num.toExponential(6);
                }
            }
            display.textContent = displayValue;
        },

        inputDigit(digit) {
            if (!this.on) return;
            if (waitingForOperand || justEvaluated) {
                currentValue = digit;
                waitingForOperand = false;
                justEvaluated = false;
            } else {
                if (currentValue === '0' && digit !== '.') {
                    currentValue = digit;
                } else {
                    if (digit === '.' && currentValue.includes('.')) return;
                    if (currentValue.length >= 12) return;
                    currentValue += digit;
                }
            }
            this.display(currentValue);
        },

        handleOperator(nextOperator) {
            if (!this.on) return;
            const inputValue = parseFloat(currentValue);

            if (operator && waitingForOperand) {
                operator = nextOperator;
                return;
            }

            if (previousValue === null && !isNaN(inputValue)) {
                previousValue = inputValue;
            }

            if (previousValue !== null && !isNaN(inputValue) && !waitingForOperand) {
                const result = this.calculate(previousValue, inputValue, operator);
                currentValue = String(result);
                this.display(currentValue);
                previousValue = result;
            } else if (previousValue === null) {
                previousValue = inputValue;
            }

            waitingForOperand = true;
            operator = nextOperator;
        },

        calculate(a, b, op) {
            switch (op) {
                case '+':
                    return a + b;
                case '-':
                case '−':
                    return a - b;
                case '×':
                    return a * b;
                case '÷':
                    if (b === 0) {
                        return 'Error';
                    }
                    return a / b;
                default:
                    return b;
            }
        },

        performOperation() {
            if (!this.on) return;
            if (operator === null || waitingForOperand) return;

            const inputValue = parseFloat(currentValue);
            const result = this.calculate(previousValue, inputValue, operator);

            if (result === 'Error') {
                currentValue = 'Error';
                this.display('Error');
                previousValue = null;
                operator = null;
                waitingForOperand = false;
                justEvaluated = true;
                return;
            }

            currentValue = String(result);
            this.display(currentValue);
            previousValue = null;
            operator = null;
            waitingForOperand = false;
            justEvaluated = true;
        },

        clearAll() {
            if (!this.on) return;
            currentValue = '0';
            previousValue = null;
            operator = null;
            waitingForOperand = false;
            justEvaluated = false;
            this.display('0');
        },

        clearEntry() {
            if (!this.on) return;
            currentValue = '0';
            waitingForOperand = false;
            this.display('0');
        },

        handlePercent() {
            if (!this.on) return;
            const value = parseFloat(currentValue);
            if (isNaN(value)) return;
            currentValue = String(value / 100);
            this.display(currentValue);
            waitingForOperand = true;
        },

        handleSquareRoot() {
            if (!this.on) return;
            const value = parseFloat(currentValue);
            if (isNaN(value) || value < 0) {
                currentValue = 'Error';
                this.display('Error');
                previousValue = null;
                operator = null;
                waitingForOperand = false;
                justEvaluated = true;
                return;
            }
            currentValue = String(Math.sqrt(value));
            this.display(currentValue);
            previousValue = null;
            operator = null;
            waitingForOperand = true;
            justEvaluated = true;
        },

        handlePi() {
            if (!this.on) return;
            currentValue = String(Math.PI);
            this.display(currentValue);
            waitingForOperand = true;
            justEvaluated = true;
        },

        handleSign() {
            if (!this.on) return;
            if (currentValue === '0' || currentValue === 'Error') return;
            if (currentValue.startsWith('-')) {
                currentValue = currentValue.substring(1);
            } else {
                currentValue = '-' + currentValue;
            }
            this.display(currentValue);
        },

        deleteLastDigit() {
            if (!this.on) return;
            if (waitingForOperand || justEvaluated || currentValue === 'Error') return;
            if (currentValue.length === 1 || (currentValue.length === 2 && currentValue.startsWith('-'))) {
                currentValue = '0';
            } else {
                currentValue = currentValue.slice(0, -1);
            }
            this.display(currentValue);
        },

        togglePower() {
            this.on = !this.on;
            if (this.on) {
                currentValue = '0';
                previousValue = null;
                operator = null;
                waitingForOperand = false;
                justEvaluated = false;
                calculatorBody.classList.remove('off');
                calculatorBody.classList.add('flicker');
                setTimeout(() => {
                    calculatorBody.classList.remove('flicker');
                }, 300);
                this.display('0');
            } else {
                calculatorBody.classList.add('off');
            }
        }
    };

    // Button click handlers
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const action = btn.dataset.action;
            const value = btn.dataset.value;

            btn.classList.add('active');
            setTimeout(() => btn.classList.remove('active'), 100);

            if (action) {
                switch (action) {
                    case 'ce':
                        calculator.clearEntry();
                        break;
                    case 'clear':
                        calculator.clearAll();
                        break;
                    case 'operator':
                        calculator.handleOperator(value);
                        break;
                    case 'equals':
                        calculator.performOperation();
                        break;
                    case 'percent':
                        calculator.handlePercent();
                        break;
                    case 'sqrt':
                        calculator.handleSquareRoot();
                        break;
                    case 'pi':
                        calculator.handlePi();
                        break;
                    case 'sign':
                        calculator.handleSign();
                        break;
                }
            } else if (value !== undefined) {
                calculator.inputDigit(value);
            }
        });
    });

    // Power switch
    powerSwitch.addEventListener('change', () => {
        calculator.togglePower();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (!calculator.on) return;

        const key = e.key;

        if (key >= '0' && key <= '9') {
            calculator.inputDigit(key);
            highlightButton(`[data-value="${key}"]`);
        } else if (key === '.') {
            calculator.inputDigit('.');
            highlightButton('[data-value="."');
        } else if (key === '+') {
            calculator.handleOperator('+');
            highlightButton('[data-action="operator"][data-value="+"]');
        } else if (key === '-') {
            calculator.handleOperator('−');
            highlightButton('[data-action="operator"][data-value="-"]');
        } else if (key === '*') {
            calculator.handleOperator('×');
            highlightButton('[data-action="operator"][data-value="×"]');
        } else if (key === '/') {
            e.preventDefault();
            calculator.handleOperator('÷');
            highlightButton('[data-action="operator"][data-value="÷"]');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            calculator.performOperation();
            highlightButton('[data-action="equals"]');
        } else if (key === '%') {
            calculator.handlePercent();
            highlightButton('[data-action="percent"]');
        } else if (key === 'Backspace') {
            calculator.deleteLastDigit();
            highlightButton('[data-action="clear"]');
        } else if (key === 'Escape' || key === 'Delete') {
            calculator.clearAll();
            highlightButton('[data-action="clear"]');
        }
    });

    function highlightButton(selector) {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.classList.add('active');
            setTimeout(() => btn.classList.remove('active'), 100);
        }
    }

    // Initial display
    calculator.display('0');
});
