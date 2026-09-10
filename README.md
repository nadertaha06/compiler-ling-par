# compiler-ling-par

[![Compilation Status](https://compiler-tester.insper-comp.com.br/svg/nadertaha06/compiler-ling-par)](https://compiler-tester.insper-comp.com.br/svg/nadertaha06/compiler-ling-par)

![Diagrama Sintático](https://compiler-tester.insper-comp.com.br/ds?version=v2.0)

```ebnf
PROGRAM = { STATEMENT } ;
STATEMENT = ( ε | ASSIGNMENT | PRINT), EOL ;
ASSIGNMENT = IDENTIFIER, "=", EXPRESSION ;
PRINT = "Println", "(", EXPRESSION, ")" ;
EXPRESSION = TERM, { ("+" | "-"), TERM } ;
TERM = FACTOR, { ("*" | "/"), FACTOR } ;
FACTOR = (("+" | "-"), FACTOR) | NUMBER | "(", EXPRESSION, ")" | IDENTIFIER ;
IDENTIFIER = LETTER, { LETTER | DIGIT | "_" } ;
NUMBER = DIGIT, { DIGIT } ;
LETTER = ( a | ... | z | A | ... | Z ) ;
DIGIT = ( 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0 ) ;
```