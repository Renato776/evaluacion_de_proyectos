//const my_args = process.argv.slice(2);
/*
* Tips for changing Open Office Orientation to Landscape:
* Select Format -> Page
* On the pop up window select the page tab.
* Select orientation -> Landscape.
* */
//Region constants definition
const PRECIO_VENTA = "precio de venta estimado";
const PRODUCCION_ESTIMADA = "produccion estimada";
const INGRESOS_TOTALES = "Total de Ingresos";
const EGRESOS_TOTALES = "Total de Egresos";
const FLOW  = 'flujo antes de impuestos';
const COSTO_PRODUCCION_UNIDAD = "costo de produccion por unidad";
const COSTO_PRODUCCION = "costo de produccion estimado";
const SALARIOS = "salarios";
const IMPREVISTOS = "imprevistos";
const PRESTACIONES = "prestaciones";
const LINEA_RECTA = "Depreciacion Linea Recta";
const TOTAL_DEPRECATION = "Total depreciacion";
const GRAVABLE = "Flujo Gravable";
const ISR = "ISR";
const POST_ISR = "Flujo despues de ISR";
const POST_ISR_PLUS_DEPRECATION = "Flujo despues de ISR + Depreciacion";
const FINAL_FLOW = "Flujo neto despues de impuestos";
const SDD = "Depreciacion Saldos Dobles Decrecientes";
const SMARC_ = "Depreciacion SMARC";
const depreciables  = {
	"mobiliario":5,
	"maquinaria":5,
	"edificio" : 20,
	"computo" : 3,
	"vehiculo" : 5,
	"herramienta" : 4
};
const SMARC = {
	3:[33.33,44.45,14.81,7.41],
	4:[20,32,19.2,11.52,5.76],
	5:[20,32,19.2,11.52,11.52,5.76],
	7:[14.29,24.49,17.49,12.49,8.93,8.92,8.93,4.46],
	10:[10.00,18.00,14.40,11.52,9.22,7.37,6.55,6.55,6.55,6.55,3.28],
	15:[5.00,9.50,8.55,7.70,6.93,6.23,5.90,5.90,5.91,5.90,5.91,5.90,5.91,5.90,5.91,2.95],
	20:[3.75,7.22,6.68,6.18,5.71,5.29,4.89,4.52,4.46,4.46,4.46,4.46,4.46,4.46,4.46,4.46,4.46,4.46,4.46,4.46,2.23]
};
//endregion
const exactness = 4;
let currency = 'Q';
function wrap_table(table){
	const ans = {};
	const keys = Object.keys(table);
	for (let i = 0; i<keys.length;i++){
		if(!Array.isArray(table[keys[i]]))ans[keys[i]] = [table[keys[i]]];
		else ans[keys[i]] = table[keys[i]];
	}
	return ans;
}
function sum_transpose_unique_cells(table){
	let i_total = 0;
	const keys = Object.keys(table);
	for (let i = 0; i<keys.length;i++){
		i_total += table[keys[i]][0];
	}
	return i_total;
}
function sum_arrays(arr1,arr2){
	let ans = [];
	for (let i  = 0; i<arr1.length&&i<arr2.length;i++){
		ans.push(arr1[i]+arr2[i]);
	}
	return ans;
}
function multiply_arrays(arr1,arr2){
	let ans = [];
	for (let i  = 0; i<arr1.length&&i<arr2.length;i++){
		ans.push(arr1[i]*arr2[i]);
	}
	return ans;
}
function clone(obj){
	return JSON.parse(JSON.stringify(obj));
}
function shift_table(table,steps){
	table = clone(table);
	let s = new Array(steps);
	Object.keys(table).forEach(key=>{
		table[key].unshift(...s);
	});
	return table;
}
function constant_array(value,size){
	let ans = [];
	for (let i = 0; i<size; i++){
		ans.push(value);
	}
	return ans;
}
function exponential_grow(array,rate){
	for (let i = 0; i<array.length;i++){
		array[i] = array[i] * Math.pow(1+rate,i);
	}
}
function linear_grow(array,rate){
	array = [...array];
	for (let i = 0; i<array.length; i++){
		array[i] = array[i] + array[i]*rate*i;
	}
	return array;
}
function subtract_arrays(arr1,arr2){
	let ans = [];
	for	(let i = 0; i<arr1.length;i++){
		ans.push(arr1[i]-arr2[i]);
	}
	return ans;
}
function sum_all(array){
	let ans = [];
	function get_values(array,index){
		let ans = [];
		for (let i = 0; i<array.length;i++){
			let arr = array[i];
			if(index<arr.length)ans.push(arr[index]);
		}
		return ans;
	}
	for (let i = 0; i<array[0].length;i++){
		let sum = get_values(array,i);
		let s = 0;
		sum.forEach(su=>{s+=su;});
		ans.push(s);
	}
	return ans;
}
function multiply_constant(array,constant){
	array = [...array];
	for (let i = 0; i<array.length;i++){
		array[i] = array[i] * constant;
	}
	return array;
}
const invest_option = function (details_, inversion, salvamento, production, egresos) {
	this.details = details_;
	currency = this.details["moneda"];
	this.details.inflacion = this.details.inflacion/100;
	this.details["TMAR"] = this.details["TMAR"]/100;
	if(this.details["ISR"]) this.details["ISR"] = this.details["ISR"]/100;
	else this.details["ISR"]= 7/100;
	this.inversion = wrap_table(inversion);
	this.salvamento = wrap_table(salvamento);
	this.egresos = egresos;
	this.production = production;
	this.ingresos = undefined;
	this.vida = undefined;
	this.linear = undefined;
	this.flows = {};
	this.options = undefined;
	this.analyze= function (){
		Printing.set_text('');
		Printing.printLog(this.details.name);
		/*This function will calculate all necessary data,
		* build tables for each and print them.*/
		const d = wrap_table(this.details);
		Printing.printTitle('Detalles');
		Printing.printTable(d,false,false);
		Printing.printTitle('Inversion Inicial');
		this.inversion["Total"] = [sum_transpose_unique_cells(this.inversion)];
		Printing.printTable(this.inversion,true);
		Printing.printTitle('Valores de Salvamento');
		this.salvamento["Total"]= [sum_transpose_unique_cells(this.salvamento)];
		Printing.printTable(this.salvamento,true);
		Printing.printTitle('Ingresos:');
		this.vida = this.production[PRODUCCION_ESTIMADA].length;
		this.production[INGRESOS_TOTALES] = multiply_arrays(this.production[PRODUCCION_ESTIMADA],
			this.production[PRECIO_VENTA]);
		let r = shift_table(this.production,1);
		Printing.printTable(r,true,false);
		Printing.printTitle('Egresos');
		this.spendings = {};
		let production_costs = constant_array(this.details[COSTO_PRODUCCION_UNIDAD],this.vida);
		let pc = production_costs.slice(1,production_costs.length);
		pc = multiply_constant(pc,this.details["inflacion"]+1);
		production_costs = [production_costs[0],...pc];
		production_costs = multiply_arrays(production_costs,this.production[PRODUCCION_ESTIMADA])
		//Alright, the first thing to add to egresos is production cost per year.
		this.spendings[COSTO_PRODUCCION] = production_costs;
		let keys = Object.keys(this.egresos);
		const size = this.vida;
		keys.forEach(key=>{
			this.spendings[key] = constant_array(this.egresos[key],size);
			exponential_grow(this.spendings[key],this.details["inflacion"]);
		});
		if(SALARIOS in this.spendings)
		{
			this.spendings[SALARIOS] = multiply_constant(this.spendings[SALARIOS],12);
			this.spendings[PRESTACIONES] = constant_array(42/100,size);
			this.spendings[PRESTACIONES] = multiply_arrays(this.spendings[PRESTACIONES],this.spendings[SALARIOS]);
		}
		if(IMPREVISTOS in this.details){
			let sub_totals = Object.values(this.spendings);
			sub_totals = sum_all(sub_totals);
			this.spendings[IMPREVISTOS] = multiply_constant(sub_totals,this.details[IMPREVISTOS]);
		}
		let totals = Object.values(this.spendings);
		this.spendings[EGRESOS_TOTALES] = sum_all(totals);
		r = shift_table(this.spendings,1);
		Printing.printTable(r,true);
		let balance = subtract_arrays(this.production[INGRESOS_TOTALES],this.spendings[EGRESOS_TOTALES]);
		this.flow = {};
		this.flow[FLOW] = balance;
		r = shift_table(this.flow,1);
		Printing.printTable(r,true);
		this.calculate_deprecation(LINEA_RECTA);
		this.calculate_deprecation(SDD);
		this.calculate_deprecation(SMARC_);
		this.build_options();
		Printing.printTitle('Analisis');
		this.options.forEach(opt=>{
			Printing.printTitle(opt.name);
			opt.details.boxDiagram();
			Printing.printSubTitle('VPN');
			opt.vpn = calculate_vpn(opt.details,opt.interest,true);
			Printing.printSubTitle('VAUE');
			opt.vaue = calculate_vaue(opt.details,opt.interest,true);
			Printing.printSubTitle('TIR');
			opt.calculate_tir(true);
			opt.set_differences();
		});
		Printing.printTitle('Resumen');
		resumen(this.options);
		Printing.save_csv();
	};
	this.build_options = function(){
	//THis method takes all the flows registered at the moment
		//And builds valid option objects.
		const keys = Object.keys(this.flows);
		this.options = [];
		for (let i = 0; i<keys.length;i++){
			let key = keys[i];
			let d = new details(0,[],[],this.vida,key);
			let f = this.flows[key];
			let ingresos = constant_array(0,this.vida+1);
			let egresos = constant_array(0,this.vida+1);
			for (let j = 0; j<f.length;j++){
				let r = f[j];
				if(r<0)egresos[j] = Math.abs(r);
				else ingresos[j] = Math.abs(r);
			}
			d.ingresos = d.ingresos_backup= ingresos;
			d.egresos =d.egresos_backup= egresos;
			d.interest = this.details["TMAR"];
			this.options.push(new option(d));
		}
	};
	this.deprecate = function(base,n,method,key ){
		switch (method) {
			case LINEA_RECTA:
			{
				let s;
				if(key in this.salvamento)s = this.salvamento[key];
				else s = 0;
				const d = (base[0]-s)/n;
				for (let i = 0; i<base.length;i++){
					if(i<n)base[i] = d;
					else base[i] = 0;
				}
			}
				return;
			case SDD:
			{
				const d = 2/n;
				for (let i = 0; i<base.length;i++){
					if(i<n) base[i] = d*base[i]*Math.pow(1-d,i);
					else base[i] = 0;
				}
			}return;
			case SMARC_:
			{
				const vals = SMARC[n];
				for (let i = 0; i<base.length;i++){
					if(i<n+1) base[i] = base[i]*(vals[i]/100);
					else base[i] = 0;
				}
			}return;
		}
	};
	this.calculate_deprecation = function (method){
		function get_n(investment){
			let n = undefined;
			let keys = Object.keys(depreciables);
			keys.forEach(key=>{if(investment.includes(key))n = depreciables[key]});
			return n;
		};
		let subject = {};
		const target_keys = Object.keys(this.inversion);
		target_keys.forEach(target=>{
			let n = get_n(target);
			if(n){
				subject[target] = constant_array(
					this.inversion[target],this.vida
				);
				this.deprecate(subject[target],n,method,target);
			}
		});
		subject[TOTAL_DEPRECATION] = sum_all(Object.values(subject));
		subject[GRAVABLE] = subtract_arrays(this.flow[FLOW],subject[TOTAL_DEPRECATION]);
		subject[ISR] = multiply_constant(subject[GRAVABLE],this.details["ISR"]);
		subject[POST_ISR] = subtract_arrays(subject[GRAVABLE],subject[ISR]);
		subject[POST_ISR_PLUS_DEPRECATION] = sum_arrays(subject[TOTAL_DEPRECATION],subject[POST_ISR]);
		let final_flow = [-this.inversion["Total"][0],...subject[POST_ISR_PLUS_DEPRECATION]];
		final_flow[final_flow.length-1] = final_flow[final_flow.length-1] + this.salvamento["Total"][0];
		subject = shift_table(subject,1);
		Printing.printTitle(method);
		Printing.printTable(subject,true);
		const vessel = {};
		vessel[FINAL_FLOW] = final_flow;
		Printing.printTable(vessel,true);
		this.flows[method] = final_flow;
	};
};
const Printing = {
	output: "output",
	printSubTitle:function(text){
		format_title(Math.ceil(3*general_size/2),text);
	},
	save_csv:function(){
		const text = document.getElementById(this.output).value;
		const data = new Blob([text], {type: 'text/csv'});
		const url = window.URL.createObjectURL(data);
		document.getElementById('download_link').href = url;
		document.getElementById('download_link').click();
	},
	set_text:function(text){
		document.getElementById(this.output).value = text;
	},
	print:function(text){
		let s = document.getElementById(this.output).value;
		s+=text;
		this.set_text(s)
	},
	printLine:function(array,formatted = true){
		for (let i = 0; i<array.length; i++){
			if(array[i]||array[i]===0){
				if(formatted)this.print(format(array[i]));
				else this.print(array[i]);
			}
			this.print(',')
		}
		this.print('\n')
	},
	printTitle:function(text){
		this.printLog(fill_string(general_size,'*'));
		this.printLog(text);
	},
	printString:function(text){
		let s = document.getElementById(this.output).value;
		s+='"'+text+'"';
		this.set_text(s);
	},
	printTable:function(table,transpose = false,formatted = true){
		/*
		* This method prints an object as a csv table
		* with ',' as delimeters. The name of each column
		* corresponds to the name of the property.
		* This means that a table object must be
		* formatted like:
		* key : [values],
		* keyN : [values]
		* The transpose parameter indicates if printing
		* the table in vertical or orizontal.
		* IF set to true prints it horizontally.
		* Otherwise it gets printed vertically.
		* */
		const lengths = [];
		const header = Object.keys(table);
		header.forEach(head=>{lengths.push(table[head].length);});
		const size = lengths[get_max(lengths)];
		if(transpose){ //We print horizontally. Therefore we must iterate trough each header:
			for (let i = 0; i<header.length; i ++){
				const head = header[i];
				const line = new Array(size + 1);
				line[0] = head;
				const values = table[head];
				for (let j = 0; j<values.length;j++){
					if(values[j]||values[j]===0)line[j+1] = values[j];
				}
				this.printLine(line,formatted);
			}
		}else{ //We must print vertically.
			const head_line = [];
			header.forEach(head=>{head_line.push(head)});
			this.printLine(head_line);
			for (let i = 0; i<size; i++){
				const line  = new Array(header.length);
				for (let j =0; j<header.length;j++){
					let head = header[j];
					let values = table[head];
					if(i<values.length)line[j] = values[i];
				}
				this.printLine(line,formatted);
			}
		}
	},
	printLog:function(text){
		let s = document.getElementById(this.output).value;
		s+=text+"\n";
		this.set_text(s);
	}
};
function format(v){
	if(!isNaN(v))return currency + (Math.round(v * 100) / 100);
	return '"'+v+'"';
}
function format_cell(cell_width,entry,filler = ' '){
	cell_width = cell_width-2;
	let formatted_entry = "|";
	if(entry.length==cell_width){
		formatted_entry+=entry+"|";
	}else if(entry.length<cell_width){
		let filler_count = Math.floor((cell_width-entry.length)/2);
		formatted_entry += fill_string(filler_count,filler);
		formatted_entry += entry;
		formatted_entry += fill_string(cell_width - filler_count - entry.length,filler);
		formatted_entry+="|";
	}else{
		formatted_entry+=entry.substring(0,cell_width-1)+"-|";
	}
	return formatted_entry;
}
function format_title(size,title,filler = '-') {
	Printing.printLog(format_cell(size,title,filler));
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
function trueShellSort(arr,asc = true){
	var len  = arr.length;
	var gapSize =  Math.floor(len/2);
	while(gapSize > 0){
		for(var i = gapSize; i < len; i++) {
			var temp = arr[i];
			var j = i;
			if(asc){
				while(j >= gapSize && arr[j - gapSize] > temp) {
					arr[j] = arr[j - gapSize];
					j -= gapSize;
				}
			}else{
				while(j >= gapSize && arr[j - gapSize] < temp) {
					arr[j] = arr[j - gapSize];
					j -= gapSize;
				}
			}
			arr[j] = temp;
		}
		gapSize = Math.floor(gapSize/2);
	}
	return arr;
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

function invert(object){
	/*
    * This method transforms an object
    * from key : value -> value : [keys]
    * */
	const result = {};
	const keys = Object.keys(object);
	for (let i = 0; i<keys.length;i++){
		const key = keys[i];
		const v = object[key];
		if(!(v in result))result[v] = [key];
		else result[v].push(key);
	}
	return result;
}
function getMaxAndLessThan(array,max){
	//This method takes all values less than max and gets theee max
	//From the result.
	if(!Array.isArray(array))return undefined;
	if(array.length==0)return undefined;
	const valid_values = [];
	array.forEach(v=>{if(v<max)valid_values.push(Number(v))});
	return valid_values[get_max(valid_values)];
}
function getIndexes(array,value){
	/*This method returns an array
	* with the indexes at which value is found within array.
	* If not found returns undefined.*/
	if(!array)return undefined;
	if(!Array.isArray(array))return undefined;
	if(array.length==0)return undefined;
	const ans = [];
	for (let i = 0; i<array.length;i++){
		if(array[i]==value)ans.push(i);
	}
	if(ans.length==0)return undefined;
	else return ans;
}
function sparse_anuality(anualidad,array){
	anualidad = Math.abs(anualidad);
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
	this.ingresos_backup = this.ingresos;
	this.egresos_backup = this.egresos;
	this.vida = vida;
	this.anuality = anualidad; //Anuality keeps its sign.
	if(anualidad<0){
		this.egresos = sparse_anuality(anualidad,this.egresos);
	}else{
		this.ingresos = sparse_anuality(anualidad,this.ingresos);
	}
	this.boxDiagram = function(){
		const ingresos = this.ingresos;
		const egresos = this.egresos;
		const heights = {0:0};
		function build_heights(array){
			for (let i = 0; i<array.length; i++){ //We print earnings first.
				const value = array[i];
				if(value!=0){
					if(!(value in heights)){
						const m = getMaxAndLessThan(Object.keys(heights),value);
						heights[value] = heights[m] + 1;
					}
				}
			}
		}
		function draw_box_line(height,values,context){
			const line = new Array(context.length);
			for (let i = 0; i<values.length; i++){
				const value = values[i];
				if(value!=0){
					const indexes = getIndexes(context,value);
					if(indexes){
						indexes.forEach(index=>{line[index] = value;});
					}
				}
			}
			Printing.printLine(line);
		}
		build_heights(ingresos);
		build_heights(egresos);
		const inverse = invert(heights);
		let keys = Object.keys(inverse);
		keys = trueShellSort(keys,false);
		keys.forEach(key=>{draw_box_line(key,inverse[key],ingresos);});
		const indexes = [];
		for(let i = 0; i<ingresos.length;i++)indexes.push(i);
		Printing.printLine(indexes,false);
		keys = trueShellSort(keys,true);
		keys.forEach(key=>{draw_box_line(key,inverse[key],egresos);});
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
	//this.vaue = calculate_vaue(details,interest,true);
	this.vaue = 0;
	this.interest = details.interest;
	this.tir = 0;
	this.vpn = 0;
	this.vpb = 0; //Valor presente beneficio
	this.vpc = 0; //Valor presente costo.
	this.coeficient = 0; //The coeficient of vpb/vpc
	this.vida = details.vida;
	this.name = details.name;
	this.details = details;
	this.expand = expand;
	this.is_best = false;
	this.set_differences = function(){
		this.vpb = this.vpc = 0;
		for(let i = 0; i<this.details.ingresos.length;i++){
			this.vpb += get_present(this.details.ingresos[i],this.interest,i);
		}
		for(let i = 0; i<this.details.egresos.length;i++){
			this.vpc += get_present(this.details.egresos[i],this.interest,i);
		}
		this.coeficient = this.vpb/this.vpc;
	}
	this.calculate_tir = function(debug = true){
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
		//Alright, now all we gotta do is to apply the formula:
		if(debug) Printing.printLog("TIR = "+a.i+" + "+step+" * "+Math.abs(a.v)+"/"+(Math.abs(a.v)+Math.abs(b.v)));
		if(a.i<0){
			if(debug)Printing.printLog("TIR = N/A < 0");
			this.tir = 'N/A < 0';
		}else{
			let ans = a.i + step*a.v/(Math.abs(a.v)+Math.abs(b.v));
			ans = ans*100;
			if(b.i<5){
				if(debug)Printing.printLog("TIR = "+ans);
				this.tir = ans;
			}
			else {
				if(debug)Printing.printLog("TIR = Infinity");
				this.tir = Infinity;
			}
		}
	};
	this.process = function(){
		this.vpn = calculate_vpn(this.details,this.interest,true);
		this.vaue = calculate_vaue(this.details,this.interest,true);
	}
}
function get_present(future,interest,n){
	return future/Math.pow(1+interest,n);
}
function get_anuality(present,n,interest,debug = false){
	let a = (interest*Math.pow(1+interest,n))/(Math.pow(1+interest,n)-1);
	if(debug)Printing.printLog('VAUE = '+format(present)+"("+a+")");
	return present*a;
}
function calculate_vpn(details,interest,debug = false){
	function extract_anuality(anuality,flow){
		if(anuality==0)return flow;
		for	(let i = 0; i<flow.length;i++){
			flow[i] = flow[i] - anuality;
		}
		return anuality;
	}
	let ingresos_backup = [...details.ingresos];
	let egresos_backup = [...details.egresos];
	let procedure = 'VPN = ';
	let anuality;
	if(details.anuality!=0){
		if(details.anuality<0)anuality = extract_anuality(Math.abs(details.anuality),details.egresos);
		else anuality = extract_anuality(Math.abs(details.anuality),details.ingresos);
	}else anuality = 0;
	if(details.anuality<0)procedure += '-';
	if(anuality!=0)procedure += anuality+'(P/A,'+(interest*100)+'%,'+(details.ingresos.length-1)+')';
	procedure = debug_vpn(details.ingresos,details.egresos,procedure,interest);
	details.ingresos = ingresos_backup;
	details.egresos = egresos_backup;
	let positive = 0;
	let negative = 0;
	for(let i = 0; i<details.ingresos.length;i++)positive += get_present(details.ingresos[i],interest,i);
	for(let i = 0; i<details.egresos.length;i++)negative += get_present(details.egresos[i],interest,i);
	if(debug){
		Printing.printLog(format(procedure));
		Printing.printLog('VPN = '+format(positive)+' - '+format(negative));
		Printing.printLog('VPN =' +format(positive-negative));
	}
	return positive - negative;
}
function debug_vpn(ingresos,egresos,procedure,interest){
	for(let i = 0; i<ingresos.length;i++){
		if(ingresos[i]!=0)if(i!=0)procedure+=' +'+ingresos[i]+'(P/F,'+(interest*100)+'%,'+i+')';
		else procedure += '+'+ingresos[i];
	}
	for(let i = 0; i<egresos.length;i++){
		if(egresos[i]!=0)if(i!=0)procedure+=' -'+egresos[i]+'(P/F,'+(interest*100)+'%,'+i+')';
		else procedure += '-'+egresos[i];
	}
	return procedure;
}
function calculate_vaue(details,interest,debug = false){
	details = clone(details);
	details.ingresos = details.ingresos_backup;
	details.egresos = details.egresos_backup;
	let vida = details.vida;
	let procedure = '"VAUE = ['
	procedure = debug_vpn(details.ingresos,details.egresos,procedure,interest);
	procedure += '] * (A/P,'+interest*100+'%,'+vida+')"';
	if(debug)Printing.printLog(procedure);
	let vpn = calculate_vpn(details,interest);
	let ren = get_anuality(vpn,details.ingresos.length-1,interest,debug);
	if(debug)Printing.printLog("VAUE = "+format(ren));
	return ren;
}
function resumen(opts){
	let useFull_data = {
		name:[],vaue:[],vpn:[],tir:[],vpb:[],vpc:[],"vpb/vpc":[]
	};
	for (let i = 0; i<opts.length;i++){
		let opt = opts[i];
		if(opt.is_best) useFull_data["name"].push('*'+opt.name);
			else useFull_data["name"].push(opt.name);
		useFull_data["vaue"].push(opt.vaue);
		useFull_data["vpn"].push(opt.vpn);
		useFull_data["tir"].push(opt.tir);
		useFull_data["vpb"].push(opt.vpb);
		useFull_data["vpc"].push(opt.vpc);
		useFull_data["vpb/vpc"].push(opt.coeficient);
	}
	Printing.printTable(useFull_data,false,false);
}
function analisis_beneficio_costo_incremental(){
	//First thing first, order the opts array by
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
	print_table_title("Testing Transpose Table building: ",general_size);
	Printing.printTable(opts[0].details,true);
	print_table_title("Testing Vertical Table Building: ",general_size);
	Printing.printTable(opts[0].details);
	opts.forEach(opt=>{
		print_table_title('BOX Diagram for: '+opt.name,general_size);
		opt.details.boxDiagram();
	});
	print_table_title("OG Analisis Beneficio Costo incremental",general_size);
	print_object_list(table,general_size);
}
let project;
let interest;
let options ;
let opts;
let option_lives =[];
const general_size = 120;
function extract_options(){
	/*
	* This function extracts user-inputted options from JSON
	* format and fills the options & option_lives arrays.
	* */
	opts = [];
	project = JSON.parse(get_source('source'));
	if(project["interest"])interest = project.interest/100;
	else interest = project.TMAR/100;
	options = project.options;
	option_lives =[];
	for(let i = 0; i<options.length; i++){
		const opt = options[i];
		let op = new option(new details(opt.anualidad,opt.ingresos,opt.egresos,opt.vida,opt.name));
		opts.push(op);
		option_lives.push(op.vida);
	}
}
function analyze_options(){
	/*
	* This method expects the opts *
	* option_lives array to be filled properly.
	* The opts array is expected to be filled with valid
	* option instances.
	* The option lives array is epxtected to contain the utility life of each option.
	* After receiving these, proceeds to calculate the mcm for
	* all project lives and expands all options accordingly.
	* TMR is expected to be set previously as a Global variable.
	* */
	const period = option_lives.reduce(lcm);
	print_table_title('Flow period (mcm): '+period,general_size);
	opts.forEach(opt=>{opt.expand(period)});
	opts.forEach(opt=>{opt.process();opt.set_differences();});
	const vpns =[];
	opts.forEach(opt=>{vpns.push(opt.vpn)});
	opts[get_max(vpns)].is_best = true;
	opts.forEach(opt=>{opt.calculate_tir()});
	opts = shellSort(opts);
	analisis_beneficio_costo_incremental();
	resumen();
}
function perform_analysis() {
	const k  = project = JSON.parse(get_source('source'));
	const test = new invest_option(k.detalles, k.inversion, k.salvamento, k.produccion, k.egresos)
	test.analyze();
	//analyze_options();
}
