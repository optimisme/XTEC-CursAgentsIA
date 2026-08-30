class Calculator {
    constructor() {
        this.display = document.getElementById('display');
        this.powerToggle = document.getElementById('powerToggle');
        this.poweredOff = document.getElementById('poweredOff');
        
        this.currentValue = '0';
        this.previousValue = null;
        this.operator = null;
        this.waitingForOperand = false;
        this.isPowered = true;
        
        this.bindEvents();
    }
    
    bindEvents() {
        document.querySelectorAll('.btn-number').forEach(btn => {
            btn.addEventListener('click', () => this.inputDigit(btn.dataset.value));
        });
        
        document.querySelectorAll('.btn-dot').forEach(btn => {
            btn.addEventListener('click', () => this.inputDot());
        });
        
        document.querySelectorAll('.btn-operator').forEach(btn => {
            btn.addEventListener('click', () => this.setOperator(btn.dataset.action));
        });
        
        document.querySelectorAll('.btn-function').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.action === 'percent') {
                    this.percent();
                } else if (btn.dataset.action === 'sqrt') {
                    this.sqrt();
                } else if (btn.dataset.action === 'sign') {
                    this.toggleSign();
                }
            });
        });
        
        document.querySelector('.pi-btn')?.addEventListener('click', () => this.inputPi());
        
        document.querySelectorAll('.btn-equals').forEach(btn => {
            btn.addEventListener('click', () => this.calculate());
        });
        
        document.querySelectorAll('.btn-clear').forEach(btn => {
            btn.addEventListener('click', () => this.clear());
        });
        
        document.querySelectorAll('.btn-clear-entry').forEach(btn => {
            btn.addEventListener('click', () => this.clearEntry());
        });
        
        this.powerToggle.addEventListener('change', (e) => {
            this.togglePower(e.target.checked);
        });
        
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    handleKeyboard(e) {
        if (!this.isPowered) return;
        
        const key = e.key;
        
        if (key >= '0' && key <= '9') {
            e.preventDefault();
            this.inputDigit(key);
        } else if (key === '.') {
            e.preventDefault();
            this.inputDot();
        } else if (key === '+') {
            e.preventDefault();
            this.setOperator('add');
        } else if (key === '-') {
            e.preventDefault();
            this.setOperator('subtract');
        } else if (key === '*') {
            e.preventDefault();
            this.setOperator('multiply');
        } else if (key === '/') {
            e.preventDefault();
            this.setOperator('divide');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            this.calculate();
        } else if (key === 'Escape' || key === 'c' || key === 'C') {
            e.preventDefault();
            this.clear();
        } else if (key === 'Backspace') {
            e.preventDefault();
            this.backspace();
        } else if (key === '%') {
            e.preventDefault();
            this.percent();
        }
    }
    
    inputDigit(digit) {
        if (!this.isPowered) return;
        
        if (this.waitingForOperand) {
            this.currentValue = digit;
            this.waitingForOperand = false;
        } else {
            if (this.currentValue === '0') {
                this.currentValue = digit;
            } else {
                if (this.currentValue.length < 12) {
                    this.currentValue += digit;
                }
            }
        }
        
        this.updateDisplay();
    }
    
    inputDot() {
        if (!this.isPowered) return;
        
        if (this.waitingForOperand) {
            this.currentValue = '0.';
            this.waitingForOperand = false;
        } else if (!this.currentValue.includes('.')) {
            this.currentValue += '.';
        }
        
        this.updateDisplay();
    }
    
    setOperator(action) {
        if (!this.isPowered) return;
        
        const value = this.parseNumber(this.currentValue);
        
        if (this.operator && !this.waitingForOperand) {
            const result = this.performCalculation(this.previousValue, value, this.operator);
            if (result === 'Error') {
                this.currentValue = 'Error';
                this.previousValue = null;
                this.operator = null;
                this.updateDisplay();
                return;
            }
            this.currentValue = this.formatResult(result);
            this.previousValue = result;
        } else {
            this.previousValue = value;
        }
        
        this.operator = action;
        this.waitingForOperand = true;
        
        this.updateDisplay();
    }
    
    calculate() {
        if (!this.isPowered) return;
        
        if (!this.operator || this.waitingForOperand) return;
        
        const previous = this.previousValue;
        const current = this.parseNumber(this.currentValue);
        
        const result = this.performCalculation(previous, current, this.operator);
        
        if (result === 'Error') {
            this.currentValue = 'Error';
        } else {
            this.currentValue = this.formatResult(result);
        }
        
        this.previousValue = null;
        this.operator = null;
        this.waitingForOperand = true;
        
        this.updateDisplay();
    }
    
    performCalculation(a, b, operator) {
        let result;
        
        switch (operator) {
            case 'add':
                result = a + b;
                break;
            case 'subtract':
                result = a - b;
                break;
            case 'multiply':
                result = a * b;
                break;
            case 'divide':
                if (b === 0) {
                    return 'Error';
                }
                result = a / b;
                break;
            default:
                return b;
        }
        
        if (!isFinite(result)) {
            return 'Error';
        }
        
        return Math.round(result * 1e10) / 1e10;
    }
    
    percent() {
        if (!this.isPowered) return;
        
        const value = this.parseNumber(this.currentValue);
        
        if (this.operator && this.previousValue !== null) {
            this.currentValue = this.formatResult(this.previousValue * (value / 100));
        } else {
            this.currentValue = this.formatResult(value / 100);
        }
        
        this.updateDisplay();
    }
    
    sqrt() {
        if (!this.isPowered) return;
        
        const value = this.parseNumber(this.currentValue);
        
        if (value < 0) {
            this.currentValue = 'Error';
        } else {
            this.currentValue = this.formatResult(Math.sqrt(value));
        }
        
        this.waitingForOperand = true;
        this.updateDisplay();
    }
    
    inputPi() {
        if (!this.isPowered) return;
        
        this.currentValue = this.formatResult(Math.PI);
        this.waitingForOperand = true;
        this.updateDisplay();
    }
    
    toggleSign() {
        if (!this.isPowered) return;
        
        if (this.currentValue === '0') return;
        
        if (this.currentValue.startsWith('-')) {
            this.currentValue = this.currentValue.substring(1);
        } else {
            this.currentValue = '-' + this.currentValue;
        }
        
        this.updateDisplay();
    }
    
    clear() {
        if (!this.isPowered) return;
        
        this.currentValue = '0';
        this.previousValue = null;
        this.operator = null;
        this.waitingForOperand = false;
        
        this.updateDisplay();
    }
    
    clearEntry() {
        if (!this.isPowered) return;
        
        this.currentValue = '0';
        this.waitingForOperand = false;
        
        this.updateDisplay();
    }
    
    backspace() {
        if (!this.isPowered) return;
        
        if (this.waitingForOperand || this.currentValue === 'Error') {
            return;
        }
        
        if (this.currentValue.length === 1 || (this.currentValue.length === 2 && this.currentValue.startsWith('-'))) {
            this.currentValue = '0';
        } else {
            this.currentValue = this.currentValue.slice(0, -1);
        }
        
        this.updateDisplay();
    }
    
    togglePower(isOn) {
        this.isPowered = isOn;
        
        if (isOn) {
            this.poweredOff.classList.remove('active');
            this.currentValue = '0';
            this.previousValue = null;
            this.operator = null;
            this.waitingForOperand = false;
            this.updateDisplay();
        } else {
            this.poweredOff.classList.add('active');
        }
    }
    
    parseNumber(str) {
        return parseFloat(str);
    }
    
    formatResult(num) {
        if (isNaN(num)) {
            return 'Error';
        }
        
        if (Number.isInteger(num) && Math.abs(num) < 1e12) {
            return num.toString();
        }
        
        if (Math.abs(num) < 0.0000001 && num !== 0) {
            return num.toExponential(4);
        }
        
        if (Math.abs(num) >= 1e12) {
            return num.toExponential(4);
        }
        
        const str = num.toString();
        if (str.length > 12) {
            return num.toPrecision(10);
        }
        
        return str;
    }
    
    updateDisplay() {
        let displayValue = this.currentValue;
        
        if (displayValue !== 'Error' && displayValue !== '0') {
            const num = this.parseNumber(displayValue);
            if (!isNaN(num) && isFinite(num)) {
                const parts = displayValue.split('.');
                if (parts.length === 2) {
                    parts[0] = parseInt(parts[0]).toLocaleString('en-US');
                    displayValue = parts.join('.');
                } else {
                    displayValue = parseInt(displayValue).toLocaleString('en-US');
                }
            }
        }
        
        if (displayValue.length > 14) {
            this.display.style.fontSize = '20px';
        } else if (displayValue.length > 11) {
            this.display.style.fontSize = '24px';
        } else {
            this.display.style.fontSize = '28px';
        }
        
        this.display.textContent = displayValue;
    }
}

const calculator = new Calculator();
