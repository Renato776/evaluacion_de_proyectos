const my_args = process.argv.slice(2);
if(my_args.length==0){
    console.log('You must specify the path to your project. Usage: node index.js PATH');
    process.exit(1);
}
const project_path = my_args[0];
const fs = require('fs');
const project = JSON.parse(fs.readFileSync(project_path));
console.log(project);

