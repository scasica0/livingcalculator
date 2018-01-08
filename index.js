//************************************************************************************************************
//        PROGRAM:       Living Calculator V1.1
//        TYPE:          Alexa Voice Services App (Kids Game)
//        AUTHOR:        Stephen Casica
//        DESCRIPTION:   Player solves a series of increasingly longer math equations
//************************************************************************************************************

'use strict';
const Alexa = require('alexa-sdk');

const APP_ID = "amzn1.ask.skill.3a77ebcc-fa4f-4b0c-9dad-ba28bebc0e6e";

exports.handler = function (event, context, callback) {
     var alexa = Alexa.handler(event, context);
     alexa.appId = APP_ID;
     alexa.registerHandlers(newSessionHandlers, startModeHandlers, gameModeHandlers);
     alexa.execute();
};

/******************************
     STATE DECLARATIONS 
******************************/
const states = {
     START_MODE: '_STARTMODE',
     GAME_MODE: '_GAMEMODE',
};

/******************************
     VARIABLES
******************************/
var output = "";
var difficulty = "";
var score;
var actual_answer;
var user_answer;
var equation_variables = [];
var number_variables;
var equation_string = "";
var possible_operators = ["plus", "minus"];

/******************************
     VOICE MESSAGE CONSTANTS
******************************/
const WELCOME_MESSAGE = "Welcome to The Living Calculator Math Game! Would You Like to play a new game?";
const DIFFICULTY_MESSAGE = "What difficulty would you like? Easy, Medium, or Hard?";
const NEW_GAME_MESSAGE = "Would you like to play a new game?";
const BEGIN_GAME_MESSAGE = "Preparing to formulate an equation on ";
const CONTINUE_GAME_MESSAGE = "Preparing another equation on ";
const DIFFICULTY_SELECTED_MESSAGE = " difficulty. ";
const TELL_EQUATION_MESSAGE = "What is the answer to the equation: ";
const CORRECT_MESSAGE = "You are correct! The answer is ";
const INCORRECT_MESSAGE = "Im sorry, your answer is false. The correct answer was actually ";
const GAME_OVER_MESSAGE = "This game is over, but you should be proud you tried. ";
const CONTINUE_MESSAGE = "Would you like to continue playing?";
const CURRENT_SCORE_MESSAGE = "Your current score is ";
const END_GAME_MESSAGE = "Okay, I have ended the game. ";
const FINAL_SCORE_MESSAGE = "Your final score is ";
const POST_GAME_MESSAGE = "Would you like to start a new game or stop playing?";
const WELCOME_REPROMPT = "You can ask me to start a new game, ask me for help, or ask me to cancel. What would you like to do?";
const HELP_MESSAGE = "You can ask me to start a new game, ask me how to play the game, or ask me to cancel. How can I help you?";
const INSTRUCTIONS_MESSAGE = "The Living Calculator is an educational math game where you solve the equation that I tell you at the start of each round. If you answer correctly, the next equation will have one extra number in it, but if you answer incorrectly, the game ends. Easy difficulty is addition only with numbers between 0 and 10. Medium difficulty is addition and subtraction with numbers between 0 and 10. Hard difficulty is addition and subtraction with numbers between 0 and 20. Would you like to play?";
const HELP_REPROMPT = 'What can I help you with?';
const TRY_AGAIN_MESSAGE = "Sorry, I did not understand what you just said. Can you please tell me again?";
const END_MESSAGE = "OK, Thanks for playing The Living Calculator game, come back soon and have a great day!";
const SPEECHCONSPOSITIVE = ["Hip hip hooray", "Hurrah", "Hurray", "Huzzah", "Oh dear.  Just kidding.  Hurray", "Kaboom", "Kaching", "Oh snap", "Phew", "Righto", "Way to go", "Well done", "Whee", "Woo hoo", "Yay", "Wowza", "Yowsa"];
const SPEECHCONSNEGATIVE = ["Argh", "Aw man", "Blarg", "Blast", "Bummer", "Darn", "D'oh", "Dun dun dun", "Eek", "Honk", "Le sigh", "Mamma mia", "Oh boy", "Oh dear", "Oof", "Ouch", "Ruh roh", "Shucks", "Uh oh", "Whoops a daisy", "Yikes"];


/******************************
     HANDLERS 
******************************/

var newSessionHandlers = {
     'LaunchRequest': function () {
          this.handler.state = states.START_MODE;
          this.emit(':ask', WELCOME_MESSAGE, WELCOME_REPROMPT);
     },
     'NewGameIntent': function () {
          this.handler.state = states.START_MODE;
          this.emitWithState('NewGameIntent');
     },
     'InstructionsIntent': function () {
          this.emit(':ask', INSTRUCTIONS_MESSAGE);
     },
     'AMAZON.YesIntent': function () {
          this.handler.state = states.START_MODE;
          this.emitWithState('Difficulty');
     },
     'AMAZON.NoIntent': function () {
          this.emitWithState('AMAZON.StopIntent');
     },
     'AMAZON.StopIntent': function () {
          this.emit(':tell', END_MESSAGE);
     },
     'AMAZON.CancelIntent': function () {
          this.emit(':tell', END_MESSAGE);
     },
     'AMAZON.HelpIntent': function () {
          this.emit(':ask', HELP_MESSAGE, HELP_REPROMPT);
     },
     'SessionEndedRequest': function () {
          this.emit('AMAZON.StopIntent');
     },
     'Unhandled': function () {
          this.emit(':ask', TRY_AGAIN_MESSAGE, WELCOME_REPROMPT);
     }
};

//Main menu (start game)
var startModeHandlers = Alexa.CreateStateHandler(states.START_MODE, {
     'NewGame': function () {
          this.emit(':ask', NEW_GAME_MESSAGE);
     },
     //Add difficulty selection
     'Difficulty': function () {
          this.emit(':ask', DIFFICULTY_MESSAGE, DIFFICULTY_MESSAGE);
     },
     'DifficultyIntent': function () {
          this.handler.state = states.GAME_MODE;
          difficulty = parseResponse(this.event.request.intent.slots);
          this.emitWithState('BeginGame');
     },
     'NewGameIntent': function () {
          this.emitWithState('Difficulty');
     },
     'InstructionsIntent': function () {
          this.emit(':ask', INSTRUCTIONS_MESSAGE);
     },
     'AMAZON.YesIntent': function () {
          this.emitWithState('Difficulty');
     },
     'AMAZON.NoIntent': function () {
          this.emitWithState('AMAZON.StopIntent');
     },
     'AMAZON.HelpIntent': function () {
          this.emit(':ask', HELP_MESSAGE, HELP_REPROMPT);
     },
     'AMAZON.StopIntent': function () {
          this.emit(':tell', END_MESSAGE);
     },
     'AMAZON.CancelIntent': function () {
          this.emit(':tell', END_MESSAGE);
     },
     'SessionEndedRequest': function () {
          this.emit('AMAZON.StopIntent');
     },
     'Unhandled': function () {
          this.emit(':ask', TRY_AGAIN_MESSAGE, WELCOME_REPROMPT);
     }
});

//Inside Game
var gameModeHandlers = Alexa.CreateStateHandler(states.GAME_MODE, {
     //Start Games, Forms Equation, Asks for Answer
     'BeginGame': function () {
          output = BEGIN_GAME_MESSAGE + difficulty + DIFFICULTY_SELECTED_MESSAGE;
          //default number_variables to 2 for easy/medium, 3 for hard and set score to 0
          if (difficulty == "hard") {
               number_variables = 3;
          }
          else {
               number_variables = 2;
          }
          score = 0;
          formEquation(difficulty);
          var output_reprompt = TELL_EQUATION_MESSAGE + equation_string + "?";
          output += output_reprompt;
          this.emit(':ask', output, output_reprompt);
     },
     //Continues game 
     'ContinueGame': function () {
          output = CONTINUE_GAME_MESSAGE + difficulty + DIFFICULTY_SELECTED_MESSAGE;
          //increase number of variables by one
          number_variables++;
          formEquation(difficulty);
          var output_reprompt = TELL_EQUATION_MESSAGE + equation_string + "?";
          output += output_reprompt;
          this.emit(':ask', output, output_reprompt);
     },
     //Process user response and check its validity
     'AnswerEquationIntent': function () {
          user_answer = parseResponse(this.event.request.intent.slots);
          let correct = checkSolution(user_answer, actual_answer);
          if (correct) {
               score++;
               output = addSpeechCon("positive") + CORRECT_MESSAGE + actual_answer + ". ";
               output += CURRENT_SCORE_MESSAGE + score + ". " + CONTINUE_MESSAGE;
               this.emit(':ask', output, CONTINUE_MESSAGE);
          }
          else {
               output = addSpeechCon("negative") + INCORRECT_MESSAGE + actual_answer + ". ";
               output += FINAL_SCORE_MESSAGE + score + ". " + GAME_OVER_MESSAGE + POST_GAME_MESSAGE;
               this.emit(':ask', output, POST_GAME_MESSAGE);
          }
     },
     'NewGameIntent': function () {
          this.handler.state = states.START_MODE;
          this.emitWithState('NewGameIntent');
     },
     'AMAZON.YesIntent': function () {
          this.emitWithState('ContinueGame');
     },
     'AMAZON.NoIntent': function () {
          output = END_GAME_MESSAGE + " " + POST_GAME_MESSAGE;
          this.emit(':ask', output, POST_GAME_MESSAGE);
     },
     'AMAZON.HelpIntent': function () {
          this.handler.state = states.START_MODE;
          this.emitWithState('AMAZON.HelpIntent');
     },
     'AMAZON.StopIntent': function () {
          this.emit(':tell', END_MESSAGE);
     },
     'AMAZON.CancelIntent': function () {
          this.emit(':tell', END_MESSAGE);
     },
     'SessionEndedRequest': function () {
          this.emit('AMAZON.StopIntent');
     },
     'Unhandled': function () {
          this.emitWithState('AnswerEquationIntent');
     }
});

/******************************
     SUPPORTING FUNCTIONS 
******************************/

//Description: Checks validity of user's answer
//Return Type: Bool
function checkSolution(user, actual) {
     if (user == actual.toString().toLowerCase()) {
          return true;
     }
     else {
          return false;
     }
}

//Description: Parses user response into string type
//Return Type: String
function parseResponse(value) {
     let slots = value;
     for (let slot in slots) {
          if (slots[slot].value != undefined) {
               return slots[slot].value.toString().toLowerCase();
          }
     }
}

//Description: Forms equation based on inputed difficulty
//Return Type: None (calls either easyEquation, mediumEquation or hardEquation functions)
function formEquation(level) {
     equation_variables = [];
     equation_string = "";
     actual_answer = 0;
     switch (level) {
          case "easy":
               easyEquation(number_variables);
               break;
          case "medium":
               mediumEquation(number_variables);
               break;
          default:
               hardEquation(number_variables);
               break;
     }
}

//Description: Forms easy difficulty equation (addition only, variables between 0 and 10)
//Return Type: Void (alters 'equation', 'equation_string' and 'actual_answer' global variables)
function easyEquation(amount) {
     for (var i = 0; i < amount; i++) {
          var new_variable = (createRandom(10, 0));
          //fill equation variable array
          equation_variables.push(new_variable);
          //fill equation_string
          equation_string += new_variable;
          if (i != amount - 1) {
               equation_string += " plus ";
          }
     }
     //calculate answer
     for (var i = 0; i < equation_variables.length; i++) {
          actual_answer += equation_variables[i];
     }
}

//Description: Forms medium difficulty equation (addition and subtraction, positive answer, variables between 0 and 10)
//Return Type: Void (alters 'equation', 'equation_string' and 'actual_answer' global variables
function mediumEquation(amount) {
     var new_variable = (createRandom(10, 0));
     var new_operator;
     //creating an initial value is required to make sure the answer is never negative
     //add initial variable to current answer amount and equation string
     equation_string += new_variable;
     actual_answer = new_variable;
     for (var i = 1; i < amount; i++) {
          new_variable = (createRandom(10, 0));
          //make sure subtraction is disabled if new variable is larger than current answer to prevent negative answer
          if (actual_answer < new_variable) {
               new_operator = "plus";
          }
          else {
               new_operator = possible_operators[createRandom(1, 0)];
          }
          //calculate new answer
          if (new_operator == "minus") {
               actual_answer -= new_variable;
          }
          else {
               actual_answer += new_variable;
          }
          //fill equation_string
          equation_string += " " + new_operator + " " + new_variable;
     }
}

//Description: Forms hard difficulty equation (addition and subtraction, variables between 0 and 20)
//Return Type: Void (alters 'equation', 'equation_string' and 'actual_answer' global variables)
function hardEquation(amount) {
     var new_variable = (createRandom(20, 0));
     var new_operator;
     //add initial variable to current answer amount and equation string
     equation_string += new_variable;
     actual_answer = new_variable;
     for (var i = 1; i < amount; i++) {
          new_variable = (createRandom(10, 0));
          //make sure subtraction is disabled if new variable is larger than current answer to prevent negative answer
          if (actual_answer < new_variable) {
               new_operator = "plus";
          }
          else {
               new_operator = possible_operators[createRandom(1, 0)];
          }
          //calculate new answer
          if (new_operator == "minus") {
               actual_answer -= new_variable;
          }
          else {
               actual_answer += new_variable;
          }
          //fill equation_string
          equation_string += " " + new_operator + " " + new_variable;
     }
}

//Description: Selects a speechcon depending on type
//Return Type: string constant of SPEECHCONSPOSITIVE or SPEECHCONSNEGATIVE
function addSpeechCon(positive_or_negative) {
     if (positive_or_negative == "positive") {
          return "<say-as interpret-as='interjection'>" + SPEECHCONSPOSITIVE[createRandom(0, SPEECHCONSPOSITIVE.length - 1)] + "! </say-as><break strength='strong'/>";
     }
     else {
          return "<say-as interpret-as='interjection'>" + SPEECHCONSNEGATIVE[createRandom(0, SPEECHCONSNEGATIVE.length - 1)] + " </say-as><break strength='strong'/>";
     }
}

//Description: Creates random number between 'max' and 'min'
//Return Type: integer between max and min
function createRandom(max, min) {
     return Math.floor(Math.random() * (max - min + 1) + min);
}