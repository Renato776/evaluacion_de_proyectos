//const my_args = process.argv.slice(2);
const exactness = 4;
const Printing = {
	output: "output",
	set_text:function(text){
		document.getElementById(this.output).value = text;
	},
	printLog:function(text){
		let s = document.getElementById(this.output).value;
		s+=text+"\n";
		this.set_text(s);
	}
};
function format_cell(cell_width,entry){
	cell_width = cell_width-2;
	let formatted_entry = "|";
	if(entry.length==cell_width){
		formatted_entry+=entry+"|";
	}else if(entry.length<cell_width){
		let filler_count = Math.floor((cell_width-entry.length)/2);
		formatted_entry += fill_string(filler_count,' ');
		formatted_entry += entry;
		formatted_entry += fill_string(cell_width - filler_count - entry.length,' ');
		formatted_entry+="|";
	}else{
		formatted_entry+=entry.substring(0,cell_width-1)+"-|";
	}
	return formatted_entry;
}
function format_title(size,title) {
	Printing.printLog(format_cell(size,title));
}
function format_row(row,size){
	let formatted_row = "";
	for (let i =0; i<row.length;i++){
		let entry = row[i];
		let formatted_entry = format_cell(Math.floor(size/row.length),entry);
		formatted_row+=formatted_entry;
	}
	Printing.printLog(formatted_row);
}
function print_object_header(object,size){
	let header = [];
	for	(let k = 0; k<Object.keys(object).length;k++){
		header.push(Object.keys(object)[k]);
	}
	format_row(header,size);
}
function print_object_body(object,size){
	let entry_row = [];
	for (let j = 0; j<Object.keys(object).length;j++){
		entry_row.push(object[Object.keys(object)[j]].toString());
	}
	format_row(entry_row,size);
}
function print_table_title(text,size){
	Printing.printLog(fill_string(size,'-'));
	format_title(size,text);
	Printing.printLog(fill_string(size,'-'));

}
function print_object_list(table,size){
	if(table.length==0)return;
	print_object_header(table[0],size);
	for (let i = 0; i<table.length; i ++){
		print_object_body(table[i],size);
	}
}
function fill_string(size,content) {
	let s = "";
	for (let i = 0; i<size; i++){
		s+=content;
	}
	return s;
}
function truncate(number){
	return Number(number.toFixed(exactness));
}
function get_source(element_id){
	let s = editor.getValue();
	return s;
}
function shellSort(arr) {
	var len  = arr.length;
	var gapSize =  Math.floor(len/2);
	while(gapSize > 0){
		for(var i = gapSize; i < len; i++) {

			var temp = arr[i];
			var j = i;

			while(j >= gapSize && arr[j - gapSize].vpc > temp.vpc) {
				arr[j] = arr[j - gapSize];
				j -= gapSize;
			}
			arr[j] = temp;
		}
		gapSize = Math.floor(gapSize/2);
	}
	return arr;
}
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
const gcd = (a, b) => a ? gcd(b % a, a) : b;
const lcm = (a, b) => a * b / gcd(a, b);
function expand(period){
	if(this.vida == period)return; //No need to expand.
	const cycles = period/this.vida;
	this.details.ingresos = expand_array(this.details.ingresos,period,cycles,this.vida);
	this.details.egresos = expand_array(this.details.egresos,period,cycles,this.vida);
}
const option = function(details){
	//this.vpn = calculate_vpn(details,interest);
	Printing.printLog('VAUE for option '+details.name+":");
	this.vaue = calculate_vaue(details,interest,true);
	this.interest = interest;
	this.tir = 0;
	this.vpn = 0;
	this.vpb = 0; //Valor presente beneficio
	this.vpc = 0; //Valor presente costo.
	this.coeficient = 0; //The coeficient of vpb/vpc
	this.vida = details.vida;
	this.name = details.name;
	this.details = details;
	this.expand = expand;
	this.set_differences = function(){
		for(let i = 0; i<this.details.ingresos.length;i++){
			this.vpb += get_present(this.details.ingresos[i],this.interest,i);
		}
		for(let i = 0; i<this.details.egresos.length;i++){
			this.vpc += get_present(this.details.egresos[i],this.interest,i);
		}
		this.coeficient = this.vpb/this.vpc;
	}
	this.calculate_tir = function(){
		//Alright, this function takes the current vpn and finds its tir.
		const step = 0.05;
		let a = {i:0,v:0};
		let b = {i:0,v:0};
		if(this.vpn<0){
			a.i = this.interest;
			a.v = this.vpn;
			while(a.v<0&&a.i>=0){
				b.i = a.i;
				b.v = a.v;
				a.i = a.i - step;
				a.v = calculate_vpn(this.details,a.i);
			}
		}else{
			b.i = this.interest;
			b.v = this.vpn;
			while(b.v>0&&b.i<5){
				a.i = b.i;
				a.v = b.v;
				b.i = b.i + step;
				b.v = calculate_vpn(this.details,b.i);
			}
		}
		//Alright, now all we gotta do is get apply the formula:
		print_table_title("TIR",general_size);
		Printing.printLog("TIR = "+a.i+" + "+step+" * "+Math.abs(a.v)+"/"+(Math.abs(a.v)+Math.abs(b.v)));
		let ans = a.i + step*a.v/(Math.abs(a.v)+Math.abs(b.v));
		ans = ans*100;
		if(b.i<5){
		Printing.printLog("TIR = "+ans);
		this.tir = ans;
		}
		else {
		Printing.printLog("TIR = Infinity");
		this.tir = Infinity;
		}
		Printing.printLog(fill_string(general_size,'-'));
	};
	this.process = function(){
		Printing.printLog("VPN for "+this.name+" :");
		this.vpn = calculate_vpn(this.details,this.interest,true);
		Printing.printLog("VPN = "+this.vpn);
	}
}
function get_present(future,interest,n){
	return future/truncate(Math.pow(1+interest,n));
}
function get_anuality(present,n,interest,debug = false){
	let a = (interest*truncate(Math.pow(1+interest,n)))/(truncate(Math.pow(1+interest,n))-1);
	a = truncate(a);
	if(debug){
		Printing.printLog('VAUE = '+truncate(present)+"("+a+")");
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
		Printing.printLog('VPN = '+positive+' - '+negative);
	}
	return positive - negative;
}
function calculate_vaue(details,interest,debug = false){
	let vpn = calculate_vpn(details,interest,true);
	let ren = get_anuality(vpn,details.ingresos.length-1,interest,debug);
	if(debug)Printing.printLog("VAUE = "+ren);
	return ren;
}
function indicate_best_option(option) {
	Printing.printLog(";-----------------------------------------------------------------");
	Printing.printLog(";------------------------Best Option------------------------------");
	Printing.printLog("The best option is: "+option.name);
	Printing.printLog("VPN = "+option.vpn);
	Printing.printLog("VAUE = "+option.vaue);
	Printing.printLog("TIR = "+option.tir);
}
function resumen(){
	print_table_title("Resumen",general_size);
	let useFull_data = [];
	for (let i = 0; i<opts.length;i++){
		let opt = opts[i];
		let entry = {};
		entry["name"] = opt.name;
		entry["vaue"] = opt.vaue;
		entry["vpn"] = opt.vpn;
		entry["tir"] = opt.tir;
		entry["vpb"] = opt.vpb;
		entry["vpc"] = opt.vpc;
		entry["vpb/vpc"] = opt.coeficient;
		useFull_data.push(entry);
	}
	print_object_list(useFull_data,general_size);
}
function analisis_beneficio_costo_incremental(){
	//First thing first, order the opts array by
	print_table_title("Analisis Beneficio Costo incremental",general_size);
	let table = [];
	for (let i = opts.length-1; i>0;i--){
		let b = opts[i];
		let a = opts[i-1];
		let entry = {};
		entry["dif_vpb"] = b.vpb - a.vpb;
		entry["dif_vpc"] = b.vpc - a.vpc;
		entry["title"] = b.name +" - "+a.name;
		entry["vpb/vpc"] = entry.dif_vpb/entry.dif_vpc;
		entry["Justifica"] = entry["vpb/vpc"] >= 1;
		table.push(entry);
	}table = table.reverse();
	print_object_list(table,general_size);
}
let project;
let interest;
let options ;
let opts;
let option_lives =[];
const general_size = 120;
function perform_analysis() {
	opts = [];
	project = JSON.parse(get_source('source'));
	interest = project.interest/100;
	options = project.options;
	option_lives =[];
	for(let i = 0; i<options.length; i++){
		const opt = options[i];
		let op = new option(new details(opt.anualidad,opt.ingresos,opt.egresos,opt.vida,opt.name));
		opts.push(op);
		option_lives.push(op.vida);
	}
	const period = option_lives.reduce(lcm);
	print_table_title('Flow period (mcm): '+period,general_size);
	opts.forEach(opt=>{opt.expand(period)});
	opts.forEach(opt=>{opt.process();opt.set_differences();});
	const vpns =[];
	opts.forEach(opt=>{vpns.push(opt.vpn)});
	let best_option = get_max(vpns);
	best_option = opts[best_option];
	best_option.calculate_tir();
	opts = shellSort(opts);
	analisis_beneficio_costo_incremental();
	resumen();
	//indicate_best_option(best_option);
}
