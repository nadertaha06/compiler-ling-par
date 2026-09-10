# compiler-ling-par

[![Compilation Status](https://compiler-tester.insper-comp.com.br/svg/nadertaha06/compiler-ling-par)](https://compiler-tester.insper-comp.com.br/svg/nadertaha06/compiler-ling-par)

![Diagrama Sintático](https://compiler-tester.insper-comp.com.br/ds?version=v2.0)

```ebnf
PROGRAM = { STATEMENT } ;
STATEMENT = ("Println", "(", EXPRESSION, ")" | IDENTIFIER, "=", EXPRESSION | Ε), "\n" ;
EXPRESSION = TERM, { ("+" | "-"), TERM } ;
TERM = FACTOR, { ("*" | "/"), FACTOR } ;
FACTOR = NUMBER | IDENTIFIER | ("+" | "-"), FACTOR | "(", EXPRESSION, ")" ;
IDENTIFIER = LETTER, { LETTER | DIGIT | "_" } ;
NUMBER = DIGIT, { DIGIT } ;
LETTER = "a" | "b" | ... | "z" | "A" | "B" | ... | "Z" ;
DIGIT = "0" | "1" | ... | "9" ;
```