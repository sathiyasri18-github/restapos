import { Component } from '@angular/core';
import { AppModule } from '../../../module/app.module';

type CalcOperator = '+' | '-' | '*' | '/';

@Component({
  selector: 'app-pos-calculator',
  imports: [AppModule],
  templateUrl: './pos-calculator.component.html',
  styleUrl: './pos-calculator.component.scss',
})
export class PosCalculatorComponent {
  display = '0';
  private storedValue: number | null = null;
  private operator: CalcOperator | null = null;
  private shouldResetDisplay = false;

  readonly keys: { label: string; action: string; wide?: boolean }[] = [
    { label: 'C', action: 'clear' },
    { label: 'CE', action: 'ce' },
    { label: '⌫', action: 'backspace' },
    { label: '÷', action: 'op:/' },
    { label: '7', action: '7' },
    { label: '8', action: '8' },
    { label: '9', action: '9' },
    { label: '×', action: 'op:*' },
    { label: '4', action: '4' },
    { label: '5', action: '5' },
    { label: '6', action: '6' },
    { label: '−', action: 'op:-' },
    { label: '1', action: '1' },
    { label: '2', action: '2' },
    { label: '3', action: '3' },
    { label: '+', action: 'op:+' },
    { label: '0', action: '0', wide: true },
    { label: '.', action: 'decimal' },
    { label: '=', action: 'equals' },
  ];

  onKey(action: string): void {
    if (action === 'clear') {
      this.clearAll();
      return;
    }
    if (action === 'ce') {
      this.display = '0';
      return;
    }
    if (action === 'backspace') {
      this.backspace();
      return;
    }
    if (action === 'decimal') {
      this.appendDecimal();
      return;
    }
    if (action === 'equals') {
      this.equals();
      return;
    }
    if (action.startsWith('op:')) {
      this.setOperator(action.slice(3) as CalcOperator);
      return;
    }
    this.appendDigit(action);
  }

  private appendDigit(digit: string): void {
    if (this.display === 'Error') {
      this.clearAll();
    }
    if (this.shouldResetDisplay) {
      this.display = digit;
      this.shouldResetDisplay = false;
      return;
    }
    this.display = this.display === '0' ? digit : this.display + digit;
  }

  private appendDecimal(): void {
    if (this.display === 'Error') {
      this.clearAll();
    }
    if (this.shouldResetDisplay) {
      this.display = '0.';
      this.shouldResetDisplay = false;
      return;
    }
    if (!this.display.includes('.')) {
      this.display += '.';
    }
  }

  private setOperator(op: CalcOperator): void {
    if (this.display === 'Error') {
      this.clearAll();
      return;
    }
    const current = parseFloat(this.display);
    if (this.storedValue !== null && this.operator !== null && !this.shouldResetDisplay) {
      const result = this.compute(this.storedValue, current, this.operator);
      if (result === null) {
        this.display = 'Error';
        this.storedValue = null;
        this.operator = null;
        this.shouldResetDisplay = true;
        return;
      }
      this.storedValue = result;
      this.display = this.formatDisplay(result);
    } else {
      this.storedValue = current;
    }
    this.operator = op;
    this.shouldResetDisplay = true;
  }

  private equals(): void {
    if (this.storedValue === null || this.operator === null || this.display === 'Error') {
      return;
    }
    const current = parseFloat(this.display);
    const result = this.compute(this.storedValue, current, this.operator);
    if (result === null) {
      this.display = 'Error';
    } else {
      this.display = this.formatDisplay(result);
    }
    this.storedValue = null;
    this.operator = null;
    this.shouldResetDisplay = true;
  }

  private backspace(): void {
    if (this.shouldResetDisplay || this.display === 'Error') {
      return;
    }
    this.display = this.display.length <= 1 ? '0' : this.display.slice(0, -1);
  }

  private clearAll(): void {
    this.display = '0';
    this.storedValue = null;
    this.operator = null;
    this.shouldResetDisplay = false;
  }

  private compute(a: number, b: number, op: CalcOperator): number | null {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? null : a / b;
    }
  }

  private formatDisplay(value: number): string {
    if (!Number.isFinite(value)) {
      return 'Error';
    }
    const rounded = Math.round(value * 1e10) / 1e10;
    const text = String(rounded);
    return text.length > 14 ? rounded.toExponential(6) : text;
  }
}
