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