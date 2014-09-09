var matrix = [[0, "inf", -2, "inf"], [4, 0, 3, "inf"], ["inf", "inf", 0, 2], ["inf", -1, "inf", 0]];
var algo = new FloydWarshallAlgorithm(matrix);

function FloydWarshallAlgorithm(distance){

	this.contextStack = new Array();

	this.distance = distance;

	this.findShortestPaths = function(context){
		var isStepMade = false;
		while(!isStepMade && (context.i < distance.length - 1 || context.j < distance.length - 1 
			|| context.k < distance.length - 1)){
			
			if(distance[context.i][context.k] != "inf" && distance[context.k][context.j] != "inf" 
					&& (distance[context.i][context.j] == "inf" 
					|| distance[context.i][context.j] > distance[context.i][context.k] + distance[context.k][context.j])){
				context.changedFrom = distance[context.i][context.j];
				context.changedTo = distance[context.i][context.k] + distance[context.k][context.j];
				context.changedRow = context.i;
				context.changedColumn = context.j;
				distance[context.i][context.j] = distance[context.i][context.k] + distance[context.k][context.j];
				isStepMade = true;
			}

			if(context.j < distance.length - 1){
				context.j++;
			}else if(context.i < distance.length - 1){
				context.i++;
				context.j = 0;
			}else if(context.k < distance.length - 1){
				context.k++;
				context.i = 0;
				context.j = 0;
			}
		}
		
		return isStepMade;
		/*for(context.k = 0; k < distance.length; k++){
			for(context.i = 0; i < distance.length; i++){
				for(context.j = 0; j < distance.length; j++){
					if(distance[i][k] != "inf" && distance[k][j] != "inf" 
							&& (distance[i][j] == "inf" || distance[i][j] > distance[i][k] + distance[k][j])){
						distance[i][j] = distance[i][k] + distance[k][j];
					}
				}
			}
		}*/
	};

	this.nextStepChoice = function(){
		if (this.contextStack.length === 0) {
			this.initializeAlgorithm();
		}

		var contextOld = this.contextStack.pop();
        var c = jQuery.extend(true, {}, contextOld);
        this.contextStack.push(contextOld);
        var contextNew;

        var isStepMade = this.findShortestPaths(c);
        var isAlgorithmFinished = false;
        if(isStepMade){
	        contextNew = jQuery.extend(true, {}, c);
	        this.contextStack.push(contextNew);
    	}
    	console.log(this.contextStack.length);
    	if(c.i == distance.length - 1 && c.j == distance.length - 1 && c.k == distance.length - 1){
    		isAlgorithmFinished = true;
    	}

        return isAlgorithmFinished;
	};

	this.backStep = function(){
		if(this.contextStack.length > 1){
			var lastStep = this.contextStack.pop();
			distance[lastStep.changedRow][lastStep.changedColumn] = lastStep.changedFrom;
		}
	};

	this.initializeAlgorithm = function(){
		var context = new Object();
		context.k = 0;
		context.i = 0;
		context.j = 0;
		context.changedFrom = null;
		context.changedTo = null;
		context.changedRow = null;
		context.changedColumn = null;
		this.contextStack.push(context);
	};

	this.visualize = function(){
		for(var i = 0; i < distance.length; i++){
			var str = "";
			for(var j = 0; j < distance.length; j++){
				str += " " + distance[i][j];
			}
			console.log(str);
		}
		console.log("");
	};

};

algo.initializeAlgorithm();
while(!algo.nextStepChoice()){
	algo.visualize();
}