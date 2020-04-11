const my_args = process.argv.slice(2);
if(my_args.length==0){
    console.log('You must specify the path to your project. Usage: node index.js PATH');
    process.exit(1);
}
const project_path = my_args[0];
const fs = require('fs');
const project = JSON.parse(fs.readFileSync(project_path));
const interest = project.interest/100;
const options = project.options;
const answers = [];
function sparse_anuality(anualidad,array){
	for (let i = 1; i<array.length; i++){
		array[i] = array[i] + anualidad;
	}
	return array;
}
function build_flow(array,vida){
	//Given an array which could be either ingresos or egresos.
		let answer = [];
		for(let i = 0; i<vida+1; i++){
			answer.push(0);
		}
		for(let i = 0; i<array.length;i++){
			let entry = array[i]; //Entry is an object of ocurre array and valor value.			
			for(let j = 0; j<entry.ocurre.length;j++){
				let ocurrence = entry.ocurre[j];
				answer[ocurrence] = answer[ocurrence]+entry.valor;
			}
		}
		return answer;
}
const details = function(anualidad,ingresos,egresos,vida){
	//This function takes the anuality,ingresos,egresos and builds an effective flow based on them and vida.
	this.ingresos = build_flow(ingresos,vida);
	this.egresos = build_flow(egresos,vida);
	this.vida = vida;
	if(anualidad<0){
		this.egresos = sparse_anuality(anualidad,this.egresos);
	}else{		
		this.ingresos = sparse_anuality(anualidad,this.ingresos);
	}
}
const option = function(details){
	this.vpn = calculate_vpn(details,interest);
	this.vaue = calculate_vaue(details,interest);
	this.interest = interest;
	//Calculate TIR.
	this.tir = 0;
}
function get_present(future,interest,n){
	return future/Math.pow(1+interest,n);
}
function get_anuality(present,n,interest){
	let a = (interest*Math.pow(1+interest,n))/(Math.pow(1+interest,n)-1);
	return present*a;
}
function calculate_vpn(details,interest,debug = true){
	//ALright, here all I have to do is to get every entry within details to present and add them together.
	let positive  = 0;
	let ingresos = details.ingresos;
	for(let i = 0; i<ingresos.length;i++){
		positive += get_present(ingresos[i],interest,i);
	}
	let negative = 0;
	let egresos = details.egresos;
	for(let i = 0; i<egresos.length;i++){
		negative += get_present(egresos[i],interest,i);
	}
	if(debug){
		console.log('VPN = '+positive+' - '+negative);
	}
	return positive - negative;
}
function calculate_vaue(details,interest){
	let vpn = calculate_vpn(details,interest,false);
	return get_anuality(vpn,details.ingresos.length-1,interest);
}
for(let i = 0; i<options.length; i++){
	const opt = options[i];
	let op = new option(new details(opt.anualidad,opt.ingresos,opt.egresos,opt.vida));
	console.log(op);
}
