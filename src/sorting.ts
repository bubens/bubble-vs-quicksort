(function (window, document, Array, Object, undefined) {

// TYPES
// In this script I deal with Integers. To make it clear I rename the types.
type Int = number;
type IntTuple = [Int, Int];
type IntList = Array<Int>;
type IntStack = Array<IntList>

type IntTree = Array<Int | IntList>;

interface Options {
	maxValue: Int
	, cellWidth: Int
};

//HELPER
// Helper functions for List/Array-Operations
function range( min: Int, max: Int ): IntList {
	return Array(max-min)
		.fill(0)
		.map(
			(_:Int, i:Int) =>
				min + i
		);
}

function equal( l1: IntList, l2: IntList ): boolean {
	return zip( l1, l2 )
		.every( 
			(t:[Int,Int]): boolean =>
				t[0] === t[1]
		)
}

function max( array: IntList ): Int {
	return Math.max.apply( undefined, array );
}

function ascends( list: IntList ): boolean {
	return list.reduce(
		( acc, v ) =>
			({prev: v, result: acc.result && acc.prev <= v})
		, {prev: list[0], result: true })
	.result;
}

function map2( fn: (x1:Int, x2:Int) => any, l1:IntList, l2:IntList ): any[] {
	return l1.length <= l2.length
		? l1.map( ( v:Int, i:Int ): any => fn( v, l2[i] ) )
		: l2.map( ( v:Int, i:Int ): any => fn( l1[i], v ) );
}

function zip( l1: IntList, l2: IntList ): IntTuple[] {
	return map2( (x: Int, y: Int) => [x,y], l1, l2 );
}

function flatten( tree: IntTree ): IntList {
	return tree.reduce(
		( acc: IntList, v: Int | IntList ): IntList =>
			Array.isArray(v)
				? [...acc, ...flatten(v) ]
				: [...acc, v]
		, []);
}

function shuffle( list: IntList, i: Int=0): IntList {
	const rndBool = ():boolean => Math.floor(Math.random() +.5) === 1;
	return i >= 13
		? list
		: shuffle(
			list.reduce(
				(acc: IntList, v: Int): IntList => 
					rndBool() 
						? [ ...acc, v ] 
						: [ v, ...acc ]
				, []
			)
			, i+1
		);
}

// SORTING-ALGS
// The algorithms are "optimized" to spit out intermediate steps not to optimal.
function sortTuple( tuple:IntTuple ):IntTuple {
	const [l,r] = tuple;
	return l <= r
		? [l,r]
		: [r,l]
}

function bubbleSortSinglePass( list: IntList ): IntList {
	if ( list.length < 2 ) {
		return list;
	}
	if ( list.length === 2 ) {
		return sortTuple( [list[0],list[1]] );
	}

	const [x, y, ...xs] = list;
	return x <= y
		? [ x, ...bubbleSortSinglePass( [y, ...xs] ) ]
		: [ y, ...bubbleSortSinglePass( [x, ...xs] ) ]
}

function bubbleSort( list: IntList, result: IntStack=[list]): IntStack {
	const next = bubbleSortSinglePass( list );
	return ascends(next)
		? [...result, next]
		: bubbleSort( next, [...result, next] );
}


function quickSortSinglePass( list: IntList ): IntTree {
	type Accumulator = [IntList, IntList];

	const [x, ...xs] = list
	const s = xs.reduce(
		( acc: Accumulator, v: Int ): Accumulator =>
			v <= x
				? [ [...acc[0], v], acc[1] ]
				: [ acc[0], [ ...acc[1], v ] ]
			, [[],[]]
		);
	return [ s[0], x, s[1] ];
}

function quickSort( list:IntTree, result:IntStack=[flatten(list)], called:Int=0 ): IntStack {
	if ( called === 0 ) {
		const l = quickSortSinglePass( flatten(list) );
		return quickSort( l, [...result, flatten(l)], called+1 );
	}
	const next = list.reduce( 
		( acc:IntTree, v: Int | IntList): IntTree => {
			if (Array.isArray(v)) {
				const len = v.length;
				if (len === 0) {
					return acc;
				}
				else if (len === 1) {
					return [ ...acc, v[0] ];
				}
				else if (len === 2) {
					return [ ...acc, ...sortTuple( [v[0], v[1]] ) ];
				}
				else {
					return [...acc, ...quickSortSinglePass( v )];
				}
			}
			else {
				return [ ...acc, v ];
			}
		}
		, []
	);
	const flatnext = flatten(next);
	return ascends(flatnext)
		? [...result, flatnext]
		: quickSort( next, [...result, flatnext], called+1 );
}


// CONTROL
// All the HTMLy stuff happens from here. 
function createCanvas(
		id: string
		, width: Int
		, height: Int
		): HTMLCanvasElement {
	return Object.assign(
		document.createElement("canvas")
		, { "id": id
			, "width": width
			, "height": height
		});
}

function getRenderingContext( canvas:HTMLCanvasElement ): CanvasRenderingContext2D {
	const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
	if ( context === null ) {
		throw ReferenceError( "Can't get rendering context for element with id <" + canvas.id +">" );
	}
	return context;
}

function getElementById( id:string ): HTMLElement {
	const elem = document.getElementById( id );
	if ( elem === null ) {
		throw ReferenceError( "No element with id " + id );
	}
	return elem;
}

function grey( value: Int, max: Int ): string {
	const color = Math.round(
		(value <= max)
			? 255 * (value/max)
			: 255 * (max/value)
		).toString();
	return ["rgb(", ",", ",", ")"].join(color)
}

function drawRect(
		x: Int
		, y: Int
		, width: Int
		, value: Int
		, max: Int
		, context: CanvasRenderingContext2D
		): void {
	context.fillStyle = grey(value, max);
	context.fillRect( x * width, y * width, width, width );
}

function drawVisualisation( stack: IntStack
	, context: CanvasRenderingContext2D
	, cellWidth: Int
	, index: Int=0

	):() => void {
	const [h, ...t] = stack;
	const m = max(h);
	return function ():void {
		h.forEach(
			(v: Int, i: Int):void =>
				drawRect(i, index, cellWidth, v, m, context)
		);
		if ( t.length > 0 ) {
			window.requestAnimationFrame( drawVisualisation(t, context, cellWidth, index+1) );
		}
	}
}

function setupVisualisation(
		algorithm: (l:any, r?:IntStack) => IntStack
		, parentID:string
		, list:IntList
		, options:Options
		): void { 
	const {maxValue, cellWidth} = options;
	const stack = algorithm(list);
	const canvas = createCanvas( parentID+"_canvas"
		, maxValue * cellWidth
		, stack.length * cellWidth);
	getElementById( parentID )
		.appendChild(canvas);

	window.requestAnimationFrame(
		drawVisualisation( stack
			, getRenderingContext( canvas )
			, cellWidth
		)
	);

}

function setupExample( parentID:string, list:IntList, options:Options ):void {
	const {maxValue, cellWidth} = options;
	const width = cellWidth * 2;
	const canvas = createCanvas( parentID+"_canvas"
		, maxValue*width
		, width);

	getElementById( parentID )
		.appendChild(canvas);

	list.forEach(
		(v:Int, i: Int):void =>
			drawRect( i, 0, width, v, maxValue, getRenderingContext(canvas) )
	);
}

function main( options: Options ):void {
	const { maxValue, cellWidth } = options;
	const list:IntList = shuffle(range( 0, maxValue ));
	
	setupExample( "example", list, options );
	setupVisualisation( bubbleSort, "bubble", list, options );
	setupVisualisation( quickSort, "quick", list, options );
}


main({
	maxValue: 50
	, cellWidth: 10
});

}(window, document, Array, Object));
