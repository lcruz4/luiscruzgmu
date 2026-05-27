type KittySortResponse =
  | {
      coords: { X: number; Y: number }[];
      cols: number[];
      message: string;
      updatedInput: string;
      solution: string[];
    }
  | {
      error: string;
    };

export const kittySortSolver = (input: string[]): KittySortResponse => {
  console.log('input:', input);

  enum Color {
    r = '❤️',
    b = '💙',
    p = '🩷',
    br = '🤎',
    bl = '🖤',
    y = '💛',
    o = '🧡',
    pu = '💜',
    g = '💚',
    w = '🤍',
    X = '❔',
    UNCOVERED = 'UNCOVERED',
  }

  let seen = new Set<string>();
  let tryEnabled = false;
  let debug = false;
  let uncover = false;
  let SIZE = 0;
  let moves = 0;
  let recurse = 1;
  let tryNum = 0;
  let maxRecurse = 0;
  let autoSolution: number[][] = [];
  let solution: string[] = [];
  let _input: Input[] = [];

  const roloc = {
    '❤️': 'r',
    '💙': 'b',
    '🩷': 'p',
    '🤎': 'f',
    '🖤': 'l',
    '💛': 'y',
    '🧡': 'o',
    '💜': 'm',
    '💚': 'g',
    '🤍': 'w',
    '❔': 'X',
    UNCOVERED: '❌',
  };

  interface Input {
    arr: Color[];
    color?: Color;
    size?: number;
  }

  const { r, b, p, br, bl, y, o, pu, g, w, X } = Color;
  const COLORHASH = {
    red: r,
    blue: b,
    pink: p,
    brown: br,
    black: bl,
    yellow: y,
    orange: o,
    purple: pu,
    green: g,
    white: w,
    unknown: X,
    r: r,
    b: b,
    p: p,
    br: br,
    bl: bl,
    y: y,
    o: o,
    pu: pu,
    g: g,
    w: w,
    x: X,
  };

  const handleError: (...args: any[]) => KittySortResponse = (...args) => {
    console.log(...args);
    return { error: args.join(' ') };
  };

  const stringNumberToNumber = (str: string) => {
    switch (str) {
      case 'one':
        return 1;
      case 'two':
        return 2;
      case 'three':
        return 3;
      case 'four':
        return 4;
      case 'five':
        return 5;
      case 'six':
        return 6;
      case 'seven':
        return 7;
      case 'eight':
        return 8;
      case 'nine':
        return 9;
      case 'ten':
        return 10;
      case 'eleven':
        return 11;
      case 'twelve':
        return 12;
      case 'thirteen':
        return 13;
      case 'fourteen':
        return 14;
      case 'fifteen':
        return 15;
      case 'sixteen':
        return 16;
      case 'seventeen':
        return 17;
      case 'eighteen':
        return 18;
      case 'nineteen':
        return 19;
      case 'twenty':
        return 20;
      default:
        return NaN;
    }
  };

  const getCoords = (id: string) => {
    switch (id) {
      case '6cols': // 3tall3empty
        return [
          { X: 120, Y: 750 },
          { X: 337, Y: 750 },
          { X: 555, Y: 750 },
          { X: 772, Y: 750 },
          { X: 990, Y: 750 },
          { X: 772, Y: 1500 },
        ];
      case '7cols':
        return [
          { X: 120, Y: 1000 },
          { X: 337, Y: 1000 },
          { X: 555, Y: 1000 },
          { X: 772, Y: 1000 },
          { X: 990, Y: 1000 },
          { X: 350, Y: 1500 },
          { X: 555, Y: 1500 },
        ];
      case '7colszigzag':
        return [
          { X: 150, Y: 1000 },
          { X: 350, Y: 1000 },
          { X: 550, Y: 1000 },
          { X: 750, Y: 1000 },
          { X: 950, Y: 1000 },
          { X: 350, Y: 1500 },
          { X: 750, Y: 1500 },
        ];
      case '7colstall':
        return [
          { X: 105, Y: 1150 },
          { X: 540, Y: 1150 },
          { X: 990, Y: 1150 },
          { X: 770, Y: 680 },
          { X: 330, Y: 940 },
          { X: 770, Y: 1150 },
          { X: 330, Y: 1350 },
        ];
      case '8cols':
        return [
          { X: 160, Y: 750 },
          { X: 352, Y: 750 },
          { X: 545, Y: 750 },
          { X: 737, Y: 750 },
          { X: 930, Y: 750 },
          { X: 240, Y: 1500 },
          { X: 443, Y: 1500 },
          { X: 646, Y: 1500 },
        ];
      case '9cols':
        return [
          { X: 120, Y: 750 },
          { X: 337, Y: 750 },
          { X: 555, Y: 750 },
          { X: 772, Y: 750 },
          { X: 990, Y: 750 },
          { X: 120, Y: 1500 },
          { X: 337, Y: 1500 },
          { X: 555, Y: 1500 },
          { X: 772, Y: 1500 },
        ];
      case '10cols':
        return [
          { X: 120, Y: 750 },
          { X: 292, Y: 750 },
          { X: 464, Y: 750 },
          { X: 636, Y: 750 },
          { X: 808, Y: 750 },
          { X: 980, Y: 750 },
          { X: 160, Y: 1500 },
          { X: 352, Y: 1500 },
          { X: 545, Y: 1500 },
          { X: 737, Y: 1500 },
        ];
      case '10colsx':
        return [
          { X: 90, Y: 750 },
          { X: 290, Y: 750 },
          { X: 800, Y: 750 },
          { X: 1000, Y: 750 },
          { X: 450, Y: 1200 },
          { X: 650, Y: 1200 },
          { X: 90, Y: 1500 },
          { X: 290, Y: 1500 },
          { X: 800, Y: 1500 },
          { X: 1000, Y: 1500 },
        ];
      case '13cols':
        return [
          { X: 120, Y: 750 },
          { X: 292, Y: 750 },
          { X: 464, Y: 750 },
          { X: 636, Y: 750 },
          { X: 808, Y: 750 },
          { X: 980, Y: 750 },
          { X: 464, Y: 1200 },
          { X: 120, Y: 1580 },
          { X: 292, Y: 1650 },
          { X: 464, Y: 1710 },
          { X: 636, Y: 1710 },
          { X: 808, Y: 1650 },
          { X: 980, Y: 1580 },
        ];
      case '11cols':
      default:
        return [
          { X: 120, Y: 750 },
          { X: 292, Y: 750 },
          { X: 464, Y: 750 },
          { X: 636, Y: 750 },
          { X: 808, Y: 750 },
          { X: 980, Y: 750 },
          { X: 120, Y: 1500 },
          { X: 292, Y: 1500 },
          { X: 464, Y: 1500 },
          { X: 636, Y: 1500 },
          { X: 808, Y: 1500 },
        ];
    }
  };

  const isSolved = (input: Input[]) => {
    for (const { arr } of input) {
      if (arr.length && (arr.length !== SIZE || !arr.every((color) => color === arr[0]))) {
        return false;
      }
    }
    return true;
  };

  const stringifyInput = (input: Input[]) => {
    let out = '\n';
    for (let x = 0; x < SIZE; x++) {
      for (let y = 0; y < input.length; y++) {
        const emptySize = SIZE - input[y].arr.length;
        out += `${emptySize - x > 0 ? '◻️' : input[y].arr[x - emptySize] || 'X'}\t`;
      }
      out += '\n';
    }

    return out;
  };

  const tryMove = (index: number, input: Input[], localRecurse: number) => {
    const { arr: fromCol, size: fromColSize = SIZE } = input[index];
    const fromTop = fromCol[0];
    if (fromCol.every((color) => color === fromTop) && colorMap[fromTop] === index) {
      // don't allow moving from full color column
      return false;
    }
    const moveWithLen = (i: number, len: number) => {
      const toArr = input[i].arr
      if (colorMap[fromTop] === -1 && toArr.filter((color) => color !== fromTop).length === 0) {
        colorMap[fromTop] = i;
      }
      const move = `${index + 1} -> ${i + 1}\t${fromCol.slice(0, len)}\t${len > 2 ? '' : '\t'}-> ${toArr}`;
      if (tryEnabled) {
        solution.push(move);
      } else {
        solution[localRecurse] = move;
        autoSolution[localRecurse] = [index, i];
      }
      if (debug) console.log('DEBUG:', stringifyInput(input));
      while (len > 0) {
        toArr.unshift(fromCol.shift()!);
        len--;
      }
      if (debug) console.log('DEBUG:', stringifyInput(input));
      moves++;
    };
    let len = 0;
    while (fromCol[len] === fromTop) {
      len++;
    }
    if (uncover && !autoSolution.find(([from, _]) => from === index)) {
      // if uncover mode and it's the first time we're moving this column,
      // only move one piece to reveal the color underneath
      len = 1;
    }
    const canMove = (toIndex: number, { arr, color, size = SIZE }: Input) => {
      const sameCol = toIndex === index; // from and to are the same
      const hasRoom = arr.length + len <= size; // to column has room for the moved pieces
      const fullColumn = len === fromCol.length; // moving the whole column
      const emptyColumn = arr.length === 0; // to column is empty
      const uselessMove = fullColumn && emptyColumn && !color && fromColSize === size; // moving a full column to an empty column
      // check that the to column matches the color we want to move.
      // if empty check color field or allow any color if not specified
      const colorAllowed = emptyColumn
        ? !color || color === fromTop
        : arr[0] === fromTop;
      return !sameCol && colorAllowed && hasRoom && !uselessMove;
    }
    const colorInd = colorMap[fromTop];
    if (colorInd !== -1 && canMove(colorInd, input[colorInd])) {
      moveWithLen(colorInd, len);
      return true;
    }
    for (const [i, inp] of input.entries()) {
      if (canMove(i, inp)) {
        moveWithLen(i, len);
        return true;
      }
    }
    return false;
  };

  const solve = (input: Input[]): Input[] | null => {
    if (uncover) {
      for (const [i, { arr }] of input.entries()) {
        if (arr[0] === X) {
          _input[i].arr[SIZE - arr.length] = Color.UNCOVERED;
          autoSolution = autoSolution.slice(0, recurse);
          return input;
        }
      }
    }
    const strArrs = JSON.stringify(input);
    if (seen.has(strArrs)) return null;
    seen.add(strArrs);
    const localRecurse = recurse;
    if (localRecurse > 100) {
      console.log('REACHED MAX MOVES!');
      return null;
    }
    if (isSolved(input)) {
      return input;
    }

    for (const [i, { arr }] of input.entries()) {
      if (maxRecurse > 500) {
        return null;
      }
      if (debug) console.log(`Trying moves for arr ${i + 1} at recurse level ${localRecurse}...`);
      const clone = JSON.parse(strArrs);

      if (arr.length) {
        if (!tryEnabled && solution.length < localRecurse) {
          solution.push('');
          autoSolution.push([]);
        }
        if (tryMove(i, clone, localRecurse)) {
          if (localRecurse === 1) tryNum++;
          if (tryEnabled) solution.push(`id: ${tryNum} - ${localRecurse}`);
          recurse++;
          maxRecurse = Math.max(maxRecurse, recurse);
          const output = solve(clone);
          if (output) {
            return output;
          }
          recurse = localRecurse;
        }
      }
    }

    return null;
  };

  const countMap: Record<Color, number> = {
    [r]: 0,
    [b]: 0,
    [p]: 0,
    [br]: 0,
    [bl]: 0,
    [y]: 0,
    [o]: 0,
    [pu]: 0,
    [g]: 0,
    [w]: 0,
    [X]: 0,
    UNCOVERED: 0,
  };

  const colorMap: Record<Color, number> = {
    [r]: -1,
    [b]: -1,
    [p]: -1,
    [br]: -1,
    [bl]: -1,
    [y]: -1,
    [o]: -1,
    [pu]: -1,
    [g]: -1,
    [w]: -1,
    [X]: -1,
    UNCOVERED: -1,
  };

  tryEnabled = input.includes('-t') || input.includes('--try');
  debug = input.includes('--debug');
  const sizeArgIndex = input.findIndex((arg) => ['-s', '--size'].includes(arg));
  const sizeArg = sizeArgIndex >= 0 ? parseInt(input[sizeArgIndex + 1]) : 0;
  if (isNaN(sizeArg)) {
    return handleError('Invalid size argument! Usage: -s <number> or --size <number>');
  }
  const inputArgIndex = input.findIndex((arg) => ['-i', '--input'].includes(arg));
  const inputArgStr = inputArgIndex >= 0 ? input[inputArgIndex + 1] : '';
  if (inputArgStr === undefined || inputArgStr[0] === '-') {
    return handleError('Invalid input argument! Usage: -i <input> or --input <input>');
  }
  if (inputArgStr && !sizeArg) {
    return handleError('Size argument is required when input argument is provided!');
  }
  const metaArgIndex = input.findIndex((arg) => ['-m', '--meta'].includes(arg));
  const metaArg = metaArgIndex >= 0 ? input[metaArgIndex + 1].toLowerCase() : '';
  if (metaArg === undefined || metaArg[0] === '-') {
    return handleError('Invalid meta argument! Usage: -m <id> or --meta <id>');
  }
  uncover =
    input.includes('-u') ||
    input.includes('--uncover') ||
    inputArgStr.includes('unknown') ||
    inputArgStr.includes('-u');

  _input = [];
  if (inputArgStr) {
    const inputArgSplit = inputArgStr.split(' ');
    let i = 0;
    let setColorArg = false;
    let setSizeArg = false;

    for (const inputStr of inputArgSplit) {
      let lower = inputStr.toLowerCase().replaceAll(/[,.]/g, '');
      if (lower === 'l') {
        lower = 'bl';
      } else if (lower === 'f') {
        lower = 'br';
      } else if (lower === 'm') {
        lower = 'pu';
      }
      const index = Math.floor(i / sizeArg);
      if (lower === 'color' || lower === 'c') {
        setColorArg = true;
        continue;
      }
      if (lower === 'size' || lower === 's') {
        setSizeArg = true;
        continue;
      }
      if (lower === 'empty' || lower === 'e') {
        _input.push({ arr: [] });
        i += sizeArg;
        continue;
      }
      if ((lower === 'n' || lower === 'new') && i % sizeArg !== 0) {
        i += sizeArg - (i % sizeArg); // move to the next column
        continue;
      }
      if (!isNaN(parseInt(lower)) || !isNaN(stringNumberToNumber(lower))) {
        const num = parseInt(lower) || stringNumberToNumber(lower);
        if (setSizeArg) {
          _input[index - 1].size = num;
          setSizeArg = false;
          continue;
        } else {
          return handleError('Size keyword must come before the size value in input argument!');
        }
      }

      const color = COLORHASH[lower as keyof typeof COLORHASH];
      if (!color) {
        continue;
      }
      if (setColorArg) {
        _input[index - 1].color = color;
        setColorArg = false;
        continue;
      }
      if (i % sizeArg === 0) {
        _input.push({ arr: [] });
      }
      _input[index].arr.push(color);
      i++;
    }
  }

  console.log(process.argv.join(' '));

  for (const [i, { arr, color, size }] of _input.entries()) {
    if (uncover && sizeArg && arr.length && arr.length < sizeArg) {
      _input[i].arr = arr.concat(Array(sizeArg - arr.length).fill(X));
    }
    if (sizeArg && arr.length > sizeArg) {
      return handleError(`Invalid input! No column can have more than ${sizeArg} pieces.`);
    }
    if (color && !size) {
      colorMap[color] = i;
    }
    for (const color of arr) {
      countMap[color] += 1;
    }
  }

  SIZE = sizeArg || Math.max(...Object.values(countMap));

  if (!uncover && Object.values(countMap).find((count) => count && count !== SIZE)) {
    return handleError(
      `Invalid input! All colors must appear 0 or ${SIZE} times.`,
      Object.entries(countMap).filter(([_, count]) => count && count !== SIZE),
    );
  }

  const output = solve(_input);
  if (output || tryEnabled) {
    for (const [i, line] of solution.entries()) {
      console.log(line);
      if (i % 5 === 0) console.log('---');
    }
    if (uncover) console.log(stringifyInput(output!));
    if (debug) console.log(maxRecurse);

    const coordId = metaArg || `${_input.length}cols`;
    return {
      coords: getCoords(coordId),
      cols: autoSolution.flat(),
      message: 'Solution found!',
      updatedInput: `${SIZE}${metaArg ? ` m ${metaArg}` : ''}\n${_input
        .map(
          ({ arr, color, size }) =>
            `${arr.map((c) => roloc[c]).join('') || 'e'}${color ? `c${roloc[color]}` : ''}${size && size !== SIZE ? `s${size}` : ''}`,
        )
        .join('\n')}${uncover ? '\n-u' : ''}`,
      solution
    };
  } else {
    return handleError('No solution found!');
  }
}
