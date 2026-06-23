class Calculator {
    constructor() {
        this.display = document.getElementById('display');
        this.powerSwitch = document.getElementById('powerSwitch');
        this.calculator = document.getElementById('calculator');
        
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.shouldResetScreen = false;
        this.isPoweredOn = true;
        
        this.display.textContent = '0';
        
        this.bindEvents();
    }

    bindEvents() {
        this.powerSwitch.addEventListener('change', (e) => {
            this.togglePower(e.target.checked);
        });

        document.querySelectorAll('button[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                if (!this.isPoweredOn) return;
                this.handleButton(button);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (!this.isPoweredOn) return;
            this.handleKeyboard(e);
        });
    }

    togglePower(isOn) {
        this.isPoweredOn = isOn;
        
        if (isOn) {
            this.calculator.classList.remove('off');
            this.display.textContent = '0';
            this.currentInput = '0';
            this.previousInput = '';
            this.operator = null;
            this.shouldResetScreen = false;
        } else {
            this.calculator.classList.add('off');
            this.display.textContent = '';
        }
    }

    handleButton(button) {
        const action = button.dataset.action;
        const value = button.dataset.value;

        switch (action) {
            case 'number':
                this.inputNumber(value);
                break;
            case 'operator':
                this.inputOperator(value);
                break;
            case 'equals':
                this.calculate();
                break;
            case 'clear':
                this.clearAll();
                break;
            case 'clear-entry':
                this.clearEntry();
                break;
            case 'decimal':
                this.inputDecimal();
                break;
            case 'percent':
                this.percent();
                break;
            case 'sqrt':
                this.squareRoot();
                break;
            case 'pi':
                this.pi();
                break;
            case 'negate':
                this.negate();
                break;
        }
    }

    handleKeyboard(e) {
        const key = e.key;

        if (key >= '0' && key <= '9') {
            e.preventDefault();
            this.inputNumber(key);
            this.highlightButton(`[data-value="${key}"][data-action="number"]`);
        } else if (key === '.') {
            e.preventDefault();
            this.inputDecimal();
            this.highlightButton('[data-action="decimal"]');
        } else if (key === '+') {
            e.preventDefault();
            this.inputOperator('+');
            this.highlightButton('[data-value="+"]');
        } else if (key === '-') {
            e.preventDefault();
            this.inputOperator('-');
            this.highlightButton('[data-value="-"]');
        } else if (key === '*') {
            e.preventDefault();
            this.inputOperator('*');
            this.highlightButton('[data-value="*"]');
        } else if (key === '/') {
            e.preventDefault();
            this.inputOperator('/');
            this.highlightButton('[data-value="/"]');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            this.calculate();
            this.highlightButton('[data-action="equals"]');
        } else if (key === 'Escape' || key === 'Delete') {
            e.preventDefault();
            this.clearAll();
            this.highlightButton('[data-action="clear"]');
        } else if (key === 'Backspace') {
            e.preventDefault();
            this.clearEntry();
            this.highlightButton('[data-action="clear-entry"]');
        } else if (key === '%') {
            e.preventDefault();
            this.percent();
            this.highlightButton('[data-action="percent"]');
        } else if (key === 's') {
            e.preventDefault();
            this.squareRoot();
            this.highlightButton('[data-action="sqrt"]');
        } else if (key === 'p') {
            e.preventDefault();
            this.pi();
            this.highlightButton('[data-action="pi"]');
        }
    }

    highlightButton(selector) {
        const button = document.querySelector(selector);
        if (button) {
            button.classList.add('active');
            setTimeout(() => {
                button.classList.remove('active');
            }, 150);
        }
    }

    inputNumber(num) {
        if (!this.isPoweredOn) return;
        
        if (this.shouldResetScreen) {
            this.currentInput = num;
            this.shouldResetScreen = false;
        } else {
            if (this.currentInput === '0' && num !== '0') {
                this.currentInput = num;
            } else if (this.currentInput === '0' && num === '0') {
                return;
            } else {
                if (this.currentInput.replace(/[^0-9]/g, '').length >= 12) {
                    return;
                }
                this.currentInput += num;
            }
        }
        this.updateDisplay();
    }

    inputDecimal() {
        if (!this.isPoweredOn) return;
        
        if (this.shouldResetScreen) {
            this.currentInput = '0.';
            this.shouldResetScreen = false;
            this.updateDisplay();
            return;
        }

        if (!this.currentInput.includes('.')) {
            this.currentInput += '.';
        }
        this.updateDisplay();
    }

    inputOperator(op) {
        if (!this.isPoweredOn) return;
        
        if (this.operator && !this.shouldResetScreen) {
            this.calculate(true);
        }

        this.previousInput = this.currentInput;
        this.operator = op;
        this.shouldResetScreen = true;
    }

    calculate(chaining = false) {
        if (!this.isPoweredOn) return;
        if (!this.operator || !this.previousInput) return;

        const prev = parseFloat(this.previousInput);
        const current = parseFloat(this.currentInput);
        let result;

        try {
            switch (this.operator) {
                case '+':
                    result = prev + current;
                    break;
                case '-':
                    result = prev - current;
                    break;
                case '*':
                    result = prev * current;
                    break;
                case '/':
                    if (current === 0) {
                        this.display.textContent = 'ERROR';
                        this.currentInput = '0';
                        this.previousInput = '';
                        this.operator = null;
                        this.shouldResetScreen = true;
                        return;
                    }
                    result = prev / current;
                    break;
                default:
                    return;
            }

            if (!isFinite(result)) {
                this.display.textContent = 'ERROR';
                this.currentInput = '0';
                this.previousInput = '';
                this.operator = null;
                this.shouldResetScreen = true;
                return;
            }

            result = Math.round(result * 1e10) / 1e10;
            this.currentInput = result.toString();
            
            if (this.currentInput.length > 12) {
                this.currentInput = result.toExponential(5);
            }

            if (!chaining) {
                this.operator = null;
                this.previousInput = '';
            }
            this.shouldResetScreen = true;
            this.updateDisplay();

        } catch (e) {
            this.display.textContent = 'ERROR';
            this.currentInput = '0';
            this.previousInput = '';
            this.operator = null;
            this.shouldResetScreen = true;
        }
    }

    percent() {
        if (!this.isPoweredOn) return;
        
        const current = parseFloat(this.currentInput);
        if (isNaN(current)) return;
        
        if (this.operator && this.previousInput) {
            const prev = parseFloat(this.previousInput);
            this.currentInput = (prev * current / 100).toString();
        } else {
            this.currentInput = (current / 100).toString();
        }
        
        this.updateDisplay();
    }

    squareRoot() {
        if (!this.isPoweredOn) return;
        
        const current = parseFloat(this.currentInput);
        if (isNaN(current)) return;
        
        if (current < 0) {
            this.display.textContent = 'ERROR';
            this.currentInput = '0';
            this.shouldResetScreen = true;
            return;
        }

        const result = Math.sqrt(current);
        this.currentInput = result.toString();
        
        if (this.currentInput.length > 12) {
            this.currentInput = result.toExponential(5);
        }
        
        this.shouldResetScreen = true;
        this.updateDisplay();
    }

    pi() {
        if (!this.isPoweredOn) return;
        
        this.currentInput = Math.PI.toString();
        this.shouldResetScreen = true;
        this.updateDisplay();
    }

    negate() {
        if (!this.isPoweredOn) return;
        
        if (this.currentInput === '0') return;
        
        if (this.currentInput.startsWith('-')) {
            this.currentInput = this.currentInput.slice(1);
        } else {
            this.currentInput = '-' + this.currentInput;
        }
        
        this.updateDisplay();
    }

    clearAll() {
        if (!this.isPoweredOn) return;
        
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.shouldResetScreen = false;
        this.updateDisplay();
    }

    clearEntry() {
        if (!this.isPoweredOn) return;
        
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }

    updateDisplay() {
        let displayValue = this.currentInput;
        
        if (displayValue.length > 12) {
            const num = parseFloat(displayValue);
            if (!isNaN(num)) {
                displayValue = num.toExponential(5);
            }
        }
        
        this.display.textContent = displayValue;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
