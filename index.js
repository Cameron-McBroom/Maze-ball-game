const generateGame = () => {
    const {
        Engine, 
        Render, 
        Runner, 
        World, 
        Bodies,
        Body,
        Events
    } = Matter;
    
    //Canvas Shape
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cellsH = 10;
    const cellsV = 10;
    
    const unitLengthX = width/cellsH;
    const unitLengthY = height/cellsV;
    
    // Initialize world to work with
    const engine = Engine.create();
    engine.world.gravity.y = 0;
    const {world} = engine;
    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width,
            height,
            wireframes: false
        }
    });
    Render.run(render);
    Runner.run(Runner.create(), engine)   
    // Walls
    const walls = [
        // Horizontal Walls
        Bodies.rectangle(width/2, 0, width, 2, {isStatic: true}),
        Bodies.rectangle(width/2, height, width, 2, {isStatic: true}),
        // Vertical Walls
        Bodies.rectangle(0, height/2, 2, height, {isStatic: true}),
        Bodies.rectangle(width, height/2, 2, height, {isStatic: true})
    ];
    World.add(world, walls)
    
    
    // Maze Generation
    const shuffle = (arr) => {
        let counter = arr.length;
    
        while (counter > 0) {
            const index = Math.floor(Math.random() * counter);
    
            counter --;
    
            const temp = arr[counter];
            arr[counter] = arr[index];
            arr[index] = temp;
        }
        return arr;
    }
    
    const grid = Array(cellsV)
        .fill(null)
        .map(() => Array(cellsH).fill(false));
    
    const verticals = Array(cellsV)
        .fill(null)
        .map(() => Array(cellsH-1).fill(false));
    
    const horizontals = Array(cellsH-1)
        .fill(null)
        .map(() => Array(cellsV).fill(false));
    
    // Starting point
    const startRow = Math.floor(Math.random()* cellsV)
    const startCol = Math.floor(Math.random()* cellsH)
    
    const loopCells = (row, col) => {
        //check to see if we have been to the position on the grid
        if (grid[row][col]) return;
    
        // Mark that we have now visited the position
        grid[row][col] = true;
    
        // Assemble random order of cell neighbors to visit
        const neighbors  = shuffle([
            [row - 1, col, "up"],
            [row, col + 1, "right"],
            [row + 1 , col, "down"],
            [row, col - 1, "left"]
        ]);
    
        // For each neighbor
        for (let neighbor of neighbors){
            const [nextRow, nextCol, direction] = neighbor;
            
            
            // Check it is not out of bounds
            if  (nextRow < 0 || nextRow >= cellsV || nextCol < 0 || nextCol >= cellsH) { 
                continue; 
            }
            
            // Check if we have already visited neighbor, continue to next neighbor
            if (grid[nextRow][nextCol]) continue;
    
            // Remove the wall based on the direction we travel
            if (direction === 'left'){
                verticals[row][col-1] = true;
            } else if (direction === "right") {
                verticals[row][col] = true;
            } else if (direction === "up"){
                horizontals[row-1][col] = true;
            } else if (direction === "down"){
                horizontals[row][col] = true;
            }
    
            loopCells(nextRow, nextCol)
        }
    }
    
    loopCells(startRow, startCol)
    
    
    horizontals.forEach((col, rowIndex) => {
        col.forEach((openWall, colIndex) => {
            if (openWall) return;
            
            const wall = Bodies.rectangle(
                colIndex * unitLengthX + unitLengthX / 2, 
                rowIndex * unitLengthY + unitLengthY,
                unitLengthX, 
                2, 
                {isStatic: true, label: "wall", render: {fillStyle: 'blue'}}
            );
            World.add(world, wall)
        }); 
    })
    
    verticals.forEach((row, rowIndex) => {
        row.forEach((openWall, colIndex) => {
            if (openWall) return;
            
            const wall = Bodies.rectangle(
                colIndex * unitLengthX + unitLengthX, 
                rowIndex * unitLengthY + unitLengthY / 2, 
                2, 
                unitLengthY, 
                {isStatic: true, label: "wall", render: {fillStyle: 'blue'}}
                )
            World.add(world, wall)
        })
    })
    
    // Maze goal
    const goalLength = Math.min(unitLengthX, unitLengthY)* 0.7;
    const goal = Bodies.rectangle(
        width - unitLengthX / 2,
        height - unitLengthY / 2,
        goalLength,
        goalLength,
        {isStatic: true, label: "goal", render: {fillStyle: '#5EEB5B'}}
    );
    World.add(world, goal)
    
    //Ball
    const ballRadius = Math.min(unitLengthX, unitLengthY) / 3.5;
    const ball = Bodies.circle(
        unitLengthX / 2,
        unitLengthY / 2,
        ballRadius,
        {label: "ball", render: {fillStyle: 'yellow'}}
    );
    World.add(world, ball)
    
    // Ball Movement
    document.addEventListener('keydown', e => {
        const {x, y} = ball.velocity;
    
        // move up
        if (e.keyCode === 87 || e.keyCode === 38) {
            Body.setVelocity(ball, {x, y: y - 5})
        } 
        
        //move left
        if (e.keyCode === 65 || e.keyCode === 37){
            Body.setVelocity(ball, {x: x-5, y})
        } 
        
        //move right
        if (e.keyCode === 68 || e.keyCode === 39){
            Body.setVelocity(ball, {x: x+5, y})
        } 
        
        // move down
        if (e.keyCode === 83 || e.keyCode === 40){
        Body.setVelocity(ball, {x, y: y + 5})
        }
    });
    
    // Win Conditions
    const winnerMessage = document.querySelector('.winner');
    Events.on(engine, 'collisionStart', e => {
        e.pairs.forEach((collision) => {
            const labels = ["ball", "goal"]
    
            if (labels.includes(collision.bodyB.label)&& 
                labels.includes(collision.bodyA.label)){
                    world.gravity.y = 1
                    for (wall of world.bodies){
                        if (wall.label === "wall") {
                            Body.setStatic(wall, false)
                        }
                    }
                winnerMessage.classList.remove('hidden')
            }
        })
    })
    // Play Again 
    const playBtn = document.querySelector('.play-btn');
    playBtn.addEventListener('click', () => {
        event.preventDefault();
        World.clear(world);
        Engine.clear(engine);
        Render.stop(render);
        render.canvas.remove();
        render.canvas = null;
        render.context = null;
        render.textures = {};
        console.log('reset clicked');
        document.querySelector('.winner').classList.add('hidden');
        generateGame()
    })
}


generateGame()

