import React, { Component } from 'react';
import { gridWidth, gridHeight } from '../redux/grid_vars';
import Cell from './Cell';
import InputBoxes from './InputBoxes';
import BoardControls from './BoardControls';

import { ContentContainerDiv, GridColumnDiv, ActionColumnDiv, GridDiv, GenerationText, InputContainer } from './Styles';

class Grid extends Component {
  // Specify how many rows and columns will be appear on the grid
  constructor() {
      super();
      this.rows = gridHeight / this.state.cellSize;
      this.columns = gridWidth / this.state.cellSize;

      this.grid = this.renderEmptyGrid();
  }

  state = {
    cellGrid: [],
    cellSize: 24,
    running: false,
    interval: 1000,
    generation: 0
  };

  // Clear the grid of all active cells
  renderEmptyGrid = () => {
    var grid = [];

    for (let y = 0; y < this.rows; y++) {
      grid[y] = [];
      for (let x = 0; x < this.state.columns; x++) {
        grid[y][x] = false;
      };
    };

    return grid;
  };

  // Create cells and add them to the grid at specified coordinates
  renderCells = () => {
    var cells = [];
    
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        if (this.grid[y][x]) {
          cells.push({ x, y });
        };
      };
    };

    return cells;
  };

  // Determine cell clicked by window position of the mouse
  getOffset = () => {
    var rect = this.gridRef.getBoundingClientRect();
    var element = document.documentElement;

    return {
      x: (rect.left + window.pageXOffset) - element.clientLeft - 1,
      y: (rect.top + window.pageYOffset) - element.clientTop - 1
    };
  };

  // If cell is clicked, toggle its state
  toggleCellState = (e) => {    
    if (!this.state.running) {
      var offset = this.getOffset();
      var offsetX = e.clientX - offset.x - 1;
      var offsetY = e.clientY - offset.y - 1;
  
      var x = Math.floor(offsetX / this.state.cellSize);
      var y = Math.floor(offsetY / this.state.cellSize);
  
      // Toggle state if cell is within grid
      if (x >= 0 && x < this.columns && y >= 0 && y < this.rows) {
        this.grid[y][x] = !this.grid[y][x];
      };
  
      // Re-render cells with updated state values
      this.setState({ cellGrid: this.renderCells() });
    };
  };

  // For each cell, check neighbor state to determine if it lives or dies
  calculateNeighbors = (grid, x, y) => {
    var liveNeighbors = 0;
    // Possible surrounding cell combinations - excludes current cell
    var options = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];

    for (let i = 0; i < options.length; i++) {
      var checkOptions = options[i];
      var y1 = y + checkOptions[0];
      var x1 = x + checkOptions[1];

      // If valid cell and grid at the neighbor cell is live, add one to neighbors
      if (x1 >= 0 && x1 < this.columns && y1 >= 0 && y1 < this.rows && grid[y1][x1]) {
        liveNeighbors++;
      };
    };

    return liveNeighbors;
  };

  runGame = () => {
    // Start with an empty grid to calculate next state
    var newGrid = this.renderEmptyGrid();

    // Loop through 2D array to check each cell
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        var neighbors = this.calculateNeighbors(this.grid, x, y);

        // If cell is live, check if 2, or 3, neighbors are also live
        if (this.grid[y][x]) {
          if (neighbors === 2 || neighbors === 3) {
            newGrid[y][x] = true;
          } else {
            newGrid[y][x] = false;
          };
        } else {
          // If cell is dead and has 3 live neighbors, make it live
          if (!this.grid[y][x] && neighbors === 3) {
            newGrid[y][x] = true;
          };
        };
      };
    };

    // Set current state to new state
    this.grid = newGrid;

    // Re-render cells based on updated state
    this.setState({ cellGrid: this.renderCells() });
    this.setState({ generation: this.state.generation + 1 });
  };

  // Invoke the run game function
  startGame = () => {
    if (!this.state.running) {
      this.setState({ running: true }, () => {
        this.intervalTimeout = setInterval(() => this.runGame(), this.state.interval)
      });
    };
  };

  stopGame = () => {
    this.setState({ running: false }, () => {
      if (this.intervalTimeout) {
        clearInterval(this.intervalTimeout)
      }
    });
  };

  // Set all cell states to dead and generation to 0
  clearGrid = () => {
    this.grid = this.renderEmptyGrid();
    this.setState({ cellGrid: this.renderCells() });
    this.setState({ generation: 0 });
  };

  randomConfig = () => {
    if (!this.state.running) {
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.columns; x++) {
          this.grid[y][x] = (Math.random() >= 0.5);
        };
      };
  
      this.setState({ cellGrid: this.renderCells() });
    };
  };

  handleCellSizeChange = (e) => {
    if (!this.state.running) {
      this.setState({ cellSize: e.target.value });
    };
  };

  handleIntervalChange = (e) => {
    if (!this.state.running) {
      this.setState({ interval: e.target.value });
    };
  };

  render() {
    return (
      <div>
        <ContentContainerDiv>
          <GridColumnDiv>
            <GridDiv
              style={{ 
                width: gridWidth,
                height: gridHeight,
                backgroundSize: `${this.state.cellSize}px ${this.state.cellSize}px`
              }}
              onClick={this.toggleCellState}
              ref={(game) => { this.gridRef = game }}>
              {this.state.cellGrid.map(cell => (
                <Cell key={`${cell.x}, ${cell.y}`} x={cell.x} y={cell.y} cellSize={this.state.cellSize} />
              ))}
            </GridDiv>
          </GridColumnDiv>
          <ActionColumnDiv>
            <GenerationText>Generation: {this.state.generation}</GenerationText>
            <InputContainer>
              <InputBoxes cellSize={this.state.cellSize} interval={this.state.interval} handleCellSizeChange={this.handleCellSizeChange} handleIntervalChange={this.handleIntervalChange} />
            </InputContainer>
            <BoardControls startGame={this.startGame} stopGame={this.stopGame} clearGrid={this.clearGrid} randomConfig={this.randomConfig} />
          </ActionColumnDiv>
        </ContentContainerDiv>
      </div>
    );
  };
};

export default Grid;