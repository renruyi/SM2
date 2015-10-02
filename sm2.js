SMCardStack = class SMCardStack {
	constructor(cardstack_id) {
		//this.
	}
}

SMCard = class SMCard {
	constructor(card_id, training_init_state){
		this.card_id = card_id;
		this.training_schedule = new TrainingSchedule(training_init_state);
	}

	train(q, in_review_session){
		this.training_schedule.train(q, in_review_session);
	}
}

class TrainingSchedule {
	constructor(init_state) {
		this.config = {};
		if (typeof init_state === 'undefined'){
			init_state = {};
		} else if (typeof init_state.config === 'undefined'){
			init_state.config = {};
		}
		this.utc_offset = init_state.utc_offset || 0;

		this.config.strict_mode = init_state.config.strict_mode || true;

		this.config.MIN_EF = 1.3;
		this.config.INTERVAL_1 = 1;
		this.config.INTERVAL_2 = 6;

		this.config.BAD_QUALITY_CUTOFF = 3;
		this.config.PASS_CUTOFF = 4;	// if scred below this value, a review session will be required

		this.interval = init_state.interval || 1;

		this.EF = init_state.EF || 1.3;
		this.response_quality = init_state.response_quality || 0;
		this.init_date = init_state.init_date || moment().zone(this.utc_offset).startOf('day').toDate();
		this.repeat_times = init_state.repeat_times || 0;
		this.training_history = init_state.training_history || [];

		this.restarted = init_state.restarted || true;	// a flag when rule# 6 from the original algorithm is applied
		this.requires_review_session = init_state.requires_review_session || false;	// a flag for the so called "quality assessment" from the original algorithm
	}

	getNow(){
		return moment()
	}

	getToday(utc_offset) {
		utc_offset = utc_offset || this.utc_offset;
		return this.getNow().zone(utc_offset).startOf('day');
	}

	isEligibleForTraining() {
		if (!this.config.strict_mode){
			return true;
		}
		if (typeof this.next_iter_scheduled === 'undefined'){
			return (this.repeat_times===0);
		}
		return this.getNow().isAfter(moment(this.next_iter_scheduled));
	}

	/*
	 * //review_session is a flag for the so called "quality assessment" from the original algorithm
	 * options = {in_review_session: false, utc_offset: 8} 
	 *
	**/
	train(q, options){
		if (typeof options === 'undefined'){
			options = {};
		}

		// update utc_offset
		this.utc_offset = options.utc_offset || this.utc_offset
		
		
		this.response_quality = q;

		this.requires_review_session = (q < this.config.PASS_CUTOFF);

		var error = '';

		if ((!options.in_review_session) && this.isEligibleForTraining()){
			this.repeat_times++;
			
			// determin the interval according to http://www.supermemo.com/english/ol/sm2.htm
			if (q < this.config.BAD_QUALITY_CUTOFF || this.repeat_times===0){
				this.interval = this.config.INTERVAL_1;
				this.restarted = true;

			} else {
				this.EF = Math.max(this.config.MIN_EF, this.EF - 0.8+0.28*q-0.02*q*q);
				if (this.restarted && this.interval===this.config.INTERVAL_1){
					this.interval = this.config.INTERVAL_2;
					this.restarted = false;
	
				} else {
					this.interval = Math.round(this.interval * this.EF);
					this.restarted = false;
	
				}
			}

			this.next_iter_scheduled = this.getToday().add(this.interval, 'days').toDate();
		} else if (options.in_review_session){
			this.repeat_times++;
		} else if (!this.isEligibleForTraining()){
			error = 'not allowed to train';
		}


		training_history_record = {
			updated: moment().toDate(),
			day: this.getToday().diff(moment(this.init_date), 'days'),
			EF: this.EF,
			repeat_times: this.repeat_times,
			in_review_session: options.in_review_session?true:false,
			days_to_next_repeat: this.interval,
			quality: this.response_quality,
			next_iter_scheduled: this.next_iter_scheduled,
			error: error
		};
		this.training_history.push(training_history_record);


	}
}

//this.SMCard = SMCard;