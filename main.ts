function main(args: string): number{
    if (!args){
        throw new Error("Dados não enviados");
    }
    let num = ""; 
    const nums: number[] = [];
    const ops: string[] = [];
    for (let i = 0; i < args.length;i++){
        if (  '0' <= args[i] && args[i]  <= '9'){
            num += args[i];
        }
        else{
            if (num != ''){
                nums.push(Number(num))
                num = ""
                
            }

            switch (args[i]) {
                case '+':
                case '-':
                    ops.push(args[i]);
                    break;
                case ' ':
                    break;
                default:
                    throw new Error("Caractere invalido");
            }
            /*
            if (args[i] == '+' || args[i] == '-' ){
                ops.push(args[i])
                break;
            }
            if (args[i] === ' ' || args[i] == ''){
                break;
            }
            else{
                throw new Error("Os numeros nao foram enviados");
            }*/
            

        }
    }
    if (num != ''){
        nums.push(Number(num))
        num = ""
    }
    if (ops.length +1 != nums.length){
        throw new Error("Os numeros nao foram enviados");
    }



    let soma = nums[0];
    for (let j = 0; j < ops.length;j++){
        
        if(ops[j] === '+'){
            soma += nums[j + 1 ] 
        }
        else{
            soma -= nums[j+1]
        }

    }
    



    return soma;
}


console.log(main(process.argv[2]))