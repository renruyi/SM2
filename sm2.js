SMCard = class SMCard {
	constructor(card_id, training_init_state){
		this.card_id = card_id;
		this.training_schedule = new TrainingSchedule(training_init_state);
	}

	train(q, in_review_session){
		this.training_schedule.train(q, in_review_session);
	}
}

TrainingSchedule = class TrainingSchedule {
	constructor(init_state) {
		if (typeof init_state === 'undefined'){
			init_state = {};
		}
		this.MIN_EF = 1.3;
		this.INTERVAL_1 = 1;
		this.INTERVAL_2 = 6;

		this.BAD_QUALITY_CUTOFF = 3;
		this.PASS_CUTOFF = 4;	// if scred below this value, a review session will be required

		this.interval = init_state.interval || 1;
		this.EF = init_state.EF || 1.3;
		this.response_quality = init_state.response_quality || 0;
		this.day = init_state.day || 0;
		this.repeat_times = init_state.repeat_times || 0;
		this.training_history = init_state.training_history || [];

		this.restarted = true;	// a flag when rule# 6 from the original algorithm is applied
		this.requires_review_session = false;	// a flag for the so called "quality assessment" from the original algorithm
	}

	recalculate_day(){
		//TODO: fix this
		return this.day;
	}

	train(q, in_review_session){
		//review_session is a flag for the so called "quality assessment" from the original algorithm

		this.recalculate_day();

		this.EF = Math.max(this.MIN_EF, this.EF - 0.8+0.28*q-0.02*q*q);
		this.response_quality = q;

		this.requires_review_session = (q < this.PASS_CUTOFF);

		if (!in_review_session){
			// determin the interval according to http://www.supermemo.com/english/ol/sm2.htm
			if (q < this.BAD_QUALITY_CUTOFF || this.repeat_times===0){
				this.interval = this.INTERVAL_1;
				this.restarted = true;

			} else {
				if (this.restarted && this.interval===this.INTERVAL_1){
					this.interval = this.INTERVAL_2;
					this.restarted = false;
	
				} else {
					this.interval = Math.round(this.interval * this.EF);
					this.restarted = false;
	
				}
			}
		}

		this.repeat_times++;

		training_history_record = {
			day: this.day,
			EF: this.EF,
			in_review_session: in_review_session,
			days_to_next_repeat: this.interval,
			quality: this.response_quality,
			next_iter_scheduled: this.day + this.interval
		};
		this.training_history.push(training_history_record);


	}
}

//this.SMCard = SMCard;