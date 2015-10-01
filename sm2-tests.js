// Write your tests here!
// Here is an example.

Tinytest.add('SMCard should be a function', function (test) {
  	test.equal(typeof SMCard, 'function');
});

Tinytest.add('Should be able to create a card', function (test) {
	testcard = new SMCard('123456')
  	test.equal(testcard.card_id, '123456');
});

Tinytest.add('initial interval should be 1', function (test) {
	test.equal(testcard.training_schedule.interval, 1);
});

Tinytest.add('if scored under 4, a review session should be required', function (test) {
	testcard.train(1);
	test.equal(testcard.training_schedule.requires_review_session, true);
});

Tinytest.add('when scored under 3, interval should change to 1 as if it was a new card', function (test) {
	test.equal(testcard.training_schedule.interval, 1);
});

Tinytest.add('results in review session should not change the interval', function (test) {
	testcard.train(2, true);
	test.equal(testcard.training_schedule.interval, 1);
});

Tinytest.add('as long as the score is under 4, another review session should be required', function (test) {
	test.equal(testcard.training_schedule.requires_review_session, true);
});

Tinytest.add('with a score of 4, review session should no long be required', function (test) {
	testcard.train(4, true);
	test.equal(testcard.training_schedule.requires_review_session, false);
});

Tinytest.add('with a score of 4 in a new training session, interval should chagne to 6', function (test) {
	testcard.train(4);
	test.equal(testcard.training_schedule.interval, 6);
});

Tinytest.add('next interval should be 8 with a score of 4', function (test) {
	testcard.train(4);
	test.equal(testcard.training_schedule.interval, 8);
});

Tinytest.add('next interval should be 11 with a score of 5', function (test) {
	testcard.train(5);
	test.equal(testcard.training_schedule.interval, 11);
});

Tinytest.add('should be able to view the history', function (test) {
	var expected_history = [{"day":0,"EF":1.3,"days_to_next_repeat":1,"quality":1,"next_iter_scheduled":1},
	{"day":0,"EF":1.3,"in_review_session":true,"days_to_next_repeat":1,"quality":2,"next_iter_scheduled":1},
	{"day":0,"EF":1.3,"in_review_session":true,"days_to_next_repeat":1,"quality":4,"next_iter_scheduled":1},
	{"day":0,"EF":1.3,"days_to_next_repeat":6,"quality":4,"next_iter_scheduled":6},
	{"day":0,"EF":1.3,"days_to_next_repeat":8,"quality":4,"next_iter_scheduled":8},
	{"day":0,"EF":1.4000000000000001,"days_to_next_repeat":11,"quality":5,"next_iter_scheduled":11}];
	test.equal(testcard.training_schedule.training_history, []);
});