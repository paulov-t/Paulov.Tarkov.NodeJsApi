var express = require('express');
var router = express.Router();
var bsgHelper =  require('../bsgHelper');

/**
 * @swagger
 * /client/survey/view:
 *   post:
 *     tags:
 *     - Survey
 *     summary: Tarkov Call 37
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/view', function(req, res, next) {

    bsgHelper.nullResponse(res);

    next();
});

/**
 * @swagger
 * /client/survey/opinion:
 *   post:
 *     tags:
 *     - Survey
 *     summary: Send the survey opinion
 *     description: This endpoint is used to send the survey opinion. 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/opinion', function(req, res, next) {

    bsgHelper.nullResponse(res);

    next();
});

/**
 * @swagger
 * /client/survey:
 *   post:
 *     tags:
 *     - Survey
 *     summary: Tarkov Call 41
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/', function(req, res, next) {

    const surveyResult = {
        "locale": {
            "en": {
                "question_1": "Do you play Official PvE?",
                "question_1_answer_1": "Not at all",
                "question_1_answer_2": "A little",
                "question_1_answer_3": "Sometimes",
                "question_1_answer_4": "Somewhat often",
                "question_1_answer_5": "Quite often",
                "question_1_answer_6": "Most of the time",
                "question_1_answer_7": "Almost always",
                "question_1_answer_8": "Always",
                "question_2": "Do you play SP Tarkov?",
                "question_2_answer_1": "Not at all",
                "question_2_answer_2": "A little",
                "question_2_answer_3": "Sometimes",
                "question_2_answer_4": "Somewhat often",
                "question_2_answer_5": "Quite often",
                "question_2_answer_6": "Most of the time",
                "question_2_answer_7": "Almost always",
                "question_2_answer_8": "Always",
                "question_3": "Did you ever use Stay in Tarkov mod?",
                "question_3_answer_1": "Yes",
                "question_3_answer_2": "No",
                "question_4": "Did you ever use Project Fika mod?",
                "question_4_answer_1": "Yes",
                "question_4_answer_2": "No",
                "question_5": "Are mods the only reason you play 'Offline Tarkov'?",
                "question_5_answer_1": "Yes",
                "question_5_answer_2": "No",
                "title": "Feedback survey",
                "time": "1 minute",
                "description": "Welcome to the feedback survey!",
                "farewell": "Thank you for your feedback!"
            }
        },
        "survey": {
            "id": 1,
            "welcomePageData": {
                "titleLocaleKey": "title",
                "timeLocaleKey": "time",
                "descriptionLocaleKey": "description"
            },
            "farewellPageData": {
                "textLocaleKey": "farewell"
            },
            "pages": [[0, 1, 2, 3]],
            "questions": [
                {
                    "id": 0,
                    "sortIndex": 1,
                    "titleLocaleKey": "question_1",
                    "hintLocaleKey": "",
                    "answerLimit": 10,
                    "answerType": "SingleOption",
                    "answers": [
                        {
                            "id": 0,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_1"
                        },
                        {
                            "id": 1,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_2"
                        },
                        {
                            "id": 2,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_3"
                        },
                        {
                            "id": 3,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_4"
                        },
                        {
                            "id": 4,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_5"
                        },
                        {
                            "id": 5,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_6"
                        },
                        {
                            "id": 6,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_7"
                        },
                        {
                            "id": 7,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_8"
                        }
                    ]
                },
                {
                    "id": 1,
                    "sortIndex": 1,
                    "titleLocaleKey": "question_2",
                    "hintLocaleKey": "",
                    "answerLimit": 8,
                    "answerType": "SingleOption",
                    "answers": [
                        {
                            "id": 0,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_1"
                        },
                        {
                            "id": 1,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_2"
                        },
                        {
                            "id": 2,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_3"
                        },
                        {
                            "id": 3,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_4"
                        },
                        {
                            "id": 4,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_5"
                        },
                        {
                            "id": 5,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_6"
                        },
                        {
                            "id": 6,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_7"
                        },
                        {
                            "id": 7,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_8"
                        }
                    ]
                },
                {
                    "id": 2,
                    "sortIndex": 2,
                    "titleLocaleKey": "question_3",
                    "hintLocaleKey": "",
                    "answerLimit": 2,
                    "answerType": "SingleOption",
                    "answers": [
                        {
                            "id": 123,
                            "questionId": 2,
                            "sortIndex": 2,
                            "localeKey": "question_3_answer_1"
                        },
                        {
                            "id": 2323,
                            "questionId": 2,
                            "sortIndex": 2,
                            "localeKey": "question_3_answer_2"
                        },
                    ]
                },
                {
                    "id": 3,
                    "sortIndex": 0,
                    "titleLocaleKey": "question_4",
                    "hintLocaleKey": "",
                    "answerLimit": 2,
                    "answerType": "SingleOption",
                    "answers": [
                        {
                            "id": 435345,
                            "questionId": 43534534,
                            "sortIndex": 0,
                            "localeKey": "question_4_answer_1"
                        },
                        {
                            "id": 3453453,
                            "questionId": 45343222,
                            "sortIndex": 1,
                            "localeKey": "question_4_answer_2"
                        },
                    ]
                }
            ],
            "isNew": false
        }
    };
    bsgHelper.addBSGBodyInResponseWithData(res, surveyResult);

    next();
});

module.exports = router;
