import { useState, useEffect } from "react";
import "./App.css";

function App() {
	const [row, setRow] = useState(30);
	const [col, setCol] = useState(50);
	const [selecting, setSelecting] = useState(false);
	const [grid, setGrid] = useState(Array.from({ length: 30 }, () => Array(50).fill(0)));
	const [point, setPoint] = useState("nothing");

	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, Number(ms)));

	const defineNode = (row, col) => {
		let newGrid = grid.map((rowArray) => [...rowArray]);

		switch (point) {
			case "goal":
				newGrid = newGrid.map((row) =>
					row.map((col) => {
						if (col === 3) {
							return 0;
						} else return col;
					})
				);
				newGrid[row][col] = 3;
				break;
			case "wall":
				if (newGrid[row][col] !== 1) {
					newGrid[row][col] = 1;
				} else {
					newGrid[row][col] = 0;
				}

				break;
			case "start":
				newGrid = newGrid.map((row) =>
					row.map((col) => {
						if (col === 2) {
							return 0;
						} else return col;
					})
				);
				newGrid[row][col] = 2;

				break;
			default:
				newGrid[row][col] = 0;
				break;
		}
		setGrid(newGrid);
	};
	async function findPath(thegrid) {
		let grid = thegrid.map((rowArray) => [...rowArray]);
		const numRows = grid.length;
		const numCols = grid[0].length;

		// Find the start and goal positions
		let start = null;
		let goal = null;

		for (let i = 0; i < numRows; i++) {
			for (let j = 0; j < numCols; j++) {
				if (grid[i][j] === 2) {
					start = { row: i, col: j };
				} else if (grid[i][j] === 3) {
					goal = { row: i, col: j };
				} else if (grid[i][j] !== 1) {
					grid[i][j] = 0;
				}
			}
		}
		setGrid(grid);

		if (!start || !goal) {
			console.error("Start or goal not found in the grid");
			return [];
		}

		// A* Algorithm
		const openList = [];
		const closedList = [];

		openList.push({ ...start, g: 0, h: calculateHeuristic(start, goal), f: 0 });

		while (openList.length > 0) {
			openList.sort((a, b) => a.f - b.f);
			const currentNode = openList.shift();

			if (currentNode.row === goal.row && currentNode.col === goal.col) {
				// Path found, reconstruct and return the path
				return reconstructPath(currentNode, grid);
			}

			closedList.push(currentNode);
			setGrid((prev) => {
				const newGrid = prev.map((rowArray) => [...rowArray]);
				newGrid[currentNode.row][currentNode.col] =
					newGrid[currentNode.row][currentNode.col] === 2 ||
					newGrid[currentNode.row][currentNode.col] === 3 ||
					newGrid[currentNode.row][currentNode.col] === 1
						? newGrid[currentNode.row][currentNode.col]
						: 5;

				return newGrid;
			});

			const neighbors = getNeighbors(currentNode, grid);

			for (const neighbor of neighbors) {
				if (
					closedList.find(
						(node) => node.row === neighbor.row && node.col === neighbor.col
					)
				) {
					continue; // Skip already processed nodes
				}

				const gScore = currentNode.g + 1;
				const hScore = calculateHeuristic(neighbor, goal);
				const fScore = hScore + gScore;

				const existingNode = openList.find(
					(node) => node.row === neighbor.row && node.col === neighbor.col
				);

				if (!existingNode || gScore < existingNode.g) {
					if (!existingNode) {
						openList.push({
							...neighbor,
							g: gScore,
							h: hScore,
							f: fScore,
							parent: currentNode,
						});
					} else {
						existingNode.g = gScore;
						existingNode.h = hScore;
						existingNode.f = fScore;
						existingNode.parent = currentNode;
					}
				}
			}
			await delay(50);
		}

		// No path found
		console.error("No path found");
		return [];
	}

	function calculateHeuristic(node, goal) {
		// Manhattan distance heuristic
		return Math.abs(node.row - goal.row) + Math.abs(node.col - goal.col);
	}

	function getNeighbors(node, grid) {
		const neighbors = [];
		const numRows = grid.length;
		const numCols = grid[0].length;

		const offsets = [
			{ row: -1, col: 0 }, // Up
			{ row: 1, col: 0 }, // Down
			{ row: 0, col: -1 }, // Left
			{ row: 0, col: 1 }, // Right
		];

		for (const offset of offsets) {
			const newRow = node.row + offset.row;
			const newCol = node.col + offset.col;

			if (
				newRow >= 0 &&
				newRow < numRows &&
				newCol >= 0 &&
				newCol < numCols &&
				grid[newRow][newCol] !== 1
			) {
				setGrid((prev) => {
					const newGrid = prev.map((rowArray) => [...rowArray]);
					newGrid[newRow][newCol] =
						newGrid[newRow][newCol] === 0 ? 6 : newGrid[newRow][newCol];
					return newGrid;
				});
				neighbors.push({ row: newRow, col: newCol });
			}
		}

		return neighbors;
	}

	function reconstructPath(node, grid) {
		const path = [];
		while (node) {
			path.unshift({ row: node.row, col: node.col, value: grid[node.row][node.col] });
			node = node.parent;
		}
		return path;
	}

	const runSimulation = async () => {
		setCursorVisible(false);
		const path = await findPath(grid);

		for (const point of path) {
			await delay(100);
			setGrid((prev) => {
				const newGrid = prev.map((rowArray) => [...rowArray]);
				newGrid[point.row][point.col] =
					newGrid[point.row][point.col] === 2 || newGrid[point.row][point.col] === 3
						? newGrid[point.row][point.col]
						: 4;
				return newGrid;
			});
			// Adjust the delay duration as needed
		}
	};

	const [cursorColor, setCursorColor] = useState("red");
	const [cursorVisible, setCursorVisible] = useState(false);
	const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

	const changeCursorColor = (color) => {
		setCursorColor(color);
		setCursorVisible(true);
	};

	const updateCursorPosition = (event) => {
		setCursorPosition({ x: event.clientX, y: event.clientY });
	};

	useEffect(() => {
		if (row >= 0 && col >= 0) {
			setGrid(Array.from({ length: row }, () => Array(col).fill(0)));
		}
	}, [row, col]);
	useEffect(() => {
		document.addEventListener("mousemove", updateCursorPosition);

		return () => {
			document.removeEventListener("mousemove", updateCursorPosition);
		};
	}, []);

	return (
		<div className="App">
			<style>
				{`
				.custom-cursor {
					width: 20px;
					height: 20px;
					background-color: ${cursorColor};
					border: 2px solid white;
					position: fixed;
					border-radius: 50%;
					pointer-events: none;
					z-index: 9999;
					display: ${cursorVisible ? "block" : "none"};
					cursor: none;
					transform: translate(-50%, -50%);
					left: ${cursorPosition.x}px;
					top: ${cursorPosition.y}px;
				}
				`}
			</style>
			<div className="custom-cursor"></div>
			<div className="settings">
				<h1>Settings</h1>
				<label>Col</label>
				<input
					type="number"
					id="colInput"
					value={col}
					onChange={(event) => setCol(Number(event.target.value))}
				/>
				<label>Row</label>
				<input
					type="number"
					id="rowInput"
					value={row}
					onChange={(event) => setRow(Number(event.target.value))}
				/>
				<button
					id="reset"
					onClick={() => {
						window.location.reload();
					}}
				>
					Create/Reset Grid
				</button>
				<button
					id="setWall"
					onClick={() => {
						changeCursorColor("#2c3e50");
						setPoint("wall");
					}}
				>
					Set wall Point
				</button>
				<button
					id="setStart"
					onClick={() => {
						changeCursorColor("rgb(202, 29, 23)");
						setPoint("start");
					}}
				>
					Set Starting Point
				</button>
				<button
					id="setGoal"
					onClick={() => {
						changeCursorColor("rgb(47, 202, 20)");
						setPoint("goal");
					}}
				>
					Set Goal Point
				</button>
				<button onClick={() => runSimulation()}>Run Simulation</button>
			</div>
			<div
				id="grid"
				className="grid"
				onMouseLeave={() => setSelecting(false)}
				onMouseDown={() => setSelecting(true)}
				onMouseUp={() => setSelecting(false)}
			>
				{grid.map((row_cells, rowIndex) => (
					<div key={rowIndex} className="row">
						{row_cells.map((cell, colIndex) => (
							<div
								key={colIndex}
								className={
									cell === 0
										? "node"
										: cell === 1
										? "node wall"
										: cell === 2
										? "node start"
										: cell === 3
										? "node goal"
										: cell === 4
										? "node path"
										: cell === 5
										? "node visited"
										: "node neighbor"
								}
								onMouseDown={() => {
									defineNode(Number(rowIndex), Number(colIndex));
								}}
								onMouseEnter={() => {
									if (selecting) {
										defineNode(Number(rowIndex), Number(colIndex));
									}
								}}
							></div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

export default App;
