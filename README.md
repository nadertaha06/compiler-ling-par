# compiler-ling-par

[![Compilation Status](https://compiler-tester.insper-comp.com.br/svg/nadertaha06/compiler-ling-par)](https://compiler-tester.insper-comp.com.br/svg/nadertaha06/compiler-ling-par)

![Diagrama Sintático](https://compiler-tester.insper-comp.com.br/ds?version=v1.2)

```ebnf
EXPRESSION = TERM, { ("+" | "-"), TERM } ;
TERM = FACTOR, { ("*" | "/"), FACTOR } ;
FACTOR = ("+" | "-"), FACTOR | "(", EXPRESSION, ")" | NUMBER ;
NUMBER = DIGIT, {DIGIT} ;
DIGIT = 0 | 1 | ... | 9 ;
```