const my_args = process.argv.slice(2);
const exactness = 4;
function truncate(number){
	return Number(number.toFixed(exactness));
}
if(my_args.length==0){
    console.log('You must specify the path to your project. Usage: node index.js PATH');
    process.exit(1);
}
const project_path = my_args[0];
const fs = require('fs');
const project = JSON.parse(fs.readFileSync(project_path));
const interest = project.interest/100;
const options = project.options;
const gcd = (a, b) => a ? gcd(b % a, a) : b;
const lcm = (a, b) => a * b / gcd(a, b);
function get_min(array) {
	let lowest = 0;
	for (let i = 1; i < array.length; i++) {
		if (array[i] < array[lowest]) lowest = i;
	}
	return lowest;
}
function get_max(array) {
	let biggest = 0;
	for (let i = 1; i < array.length; i++) {
		if (array[i] > array[biggest]) biggest = i;
	}
	return biggest;
}
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
const details = function(anualidad,ingresos,egresos,vida,name){
	//This function takes the anuality,ingresos,egresos and builds an effective flow based on them and vida.
	this.name = name;
	this.ingresos = build_flow(ingresos,vida);
	this.egresos = build_flow(egresos,vida);
	this.vida = vida;
	if(anualidad<0){
		this.egresos = sparse_anuality(anualidad,this.egresos);
	}else{		
		this.ingresos = sparse_anuality(anualidad,this.ingresos);
	}
}
function new_array(og,size){
	let r = [];
	for	(let i = 0; i<size;i++){
		r.push(og);
	}
	return r;
}
function expand_array(subject,period,cycles,vida) {
	let new_flow = new_array(0,period+1);
	for (let i = 0; i<cycles;i++){
		let r = i * vida;
		for (let j = 0; j<subject.length;j++){
			new_flow[r+j] = subject[j]+new_flow[r+j];
		}
	}
	return [...new_flow];
}

function expand(period){
	if(this.vida == period)return; //No need to expand.
	const cycles = period/this.vida;
	this.details.ingresos = expand_array(this.details.ingresos,period,cycles,this.vida);
	this.details.egresos = expand_array(this.details.egresos,period,cycles,this.vida);
}
const option = function(details){
	//this.vpn = calculate_vpn(details,interest);
	console.log('VAUE for option '+details.name+":");
	this.vaue = calculate_vaue(details,interest,true);
	this.interest = interest;
	this.tir = 0;
	this.vpn = 0;
	this.vida = details.vida;
	this.name = details.name;
	this.details = details;
	this.expand = expand;
	this.calculate_tir = function(){
		//Alright, this function takes the current vpn and finds its tir.
		const step = 0.05;
		let a = {i:0,v:0};
		let b = {i:0,v:0};
		if(this.vpn<0){
			a.i = this.interest;
			a.v = this.vpn;
			while(b.v<0){
				b.i = a.i;
				b.v = a.v;
				a.i = a.i - step;
				a.v = calculate_vpn(this.details,a.i);
			}
		}else{
			b.i = this.interest;
			b.v = this.vpn;
			while(b.v>0){
				a.i = b.i;
				a.v = b.v;
				b.i = b.i + step;
				b.v = calculate_vpn(this.details,b.i);
			}
		}
		//Alright, now all we gotta do is get apply the formula:
		console.log("TIR = "+a.i+" + "+step+" * "+Math.abs(a.v)+"/"+(Math.abs(a.v)+Math.abs(b.v)));
		let ans = a.i + step*a.v/(Math.abs(a.v)+Math.abs(b.v));
		ans = ans*100;
		console.log("TIR = "+ans);
		this.tir = ans;
	}
	this.process = function(){
		console.log("VPN for "+this.name+" :");
		this.vpn = calculate_vpn(this.details,this.interest,true);
		console.log("VPN = "+this.vpn);
	}
}
function get_present(future,interest,n){
	return future/truncate(Math.pow(1+interest,n));
}
function get_anuality(present,n,interest,debug = false){
	let a = (interest*truncate(Math.pow(1+interest,n)))/(truncate(Math.pow(1+interest,n))-1);
	a = truncate(a);
	if(debug){
		console.log('VAUE = '+truncate(present)+"("+a+")");
	}
	return truncate(present)*a;
}
function calculate_vpn(details,interest,debug = false){
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
function calculate_vaue(details,interest,debug = false){
	let vpn = calculate_vpn(details,interest);
	let ren = get_anuality(vpn,details.ingresos.length-1,interest,debug);
	if(debug)console.log("VAUE = "+ren);
	return ren;
}
const opts = [];
const option_lives =[];
for(let i = 0; i<options.length; i++){
	const opt = options[i];
	let op = new option(new details(opt.anualidad,opt.ingresos,opt.egresos,opt.vida,opt.name));
	opts.push(op);
	option_lives.push(op.vida);
}
function indicate_best_option(option) {
	console.log("The best option is: "+option.name);
	console.log("VPN = "+option.vpn);
	console.log("VAUE = "+option.vaue);
	console.log("TIR = "+option.tir);
}
const period = option_lives.reduce(lcm);
//Alright, now we gotta scale the flows to the new period.
console.log('Flow period (mcm): '+period);
opts.forEach(opt=>{opt.expand(period)});
opts.forEach(opt=>{opt.process()});
const vpns =[];
opts.forEach(opt=>{vpns.push(opt.vpn)});
let best_option = get_max(vpns);
best_option = opts[best_option];
best_option.calculate_tir();
indicate_best_option(best_option);

