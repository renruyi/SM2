SMCardStack = class SMCardStack {
	constructor(cardstack_id) {
		//this.
	}
}

SMCardModel = new Mongo.Collection('SMCards');

SMCard = class SMCard {
	constructor(options){
		if (typeof options === 'undefined'){
			options = {};
		}
		let collection_name = options.collection_name || 'SMCards'

		this.Model = SMCardModel;

		let self = this;

		if (options._id){			
			this._id = options._id;
			options = this.Model.findOne({_id: this._id});
			this.userId = options.userId;
		}else if (options.training_progress || options.userId) {
			this.Model.insert(options, function(err, id){
				if (err){
					return err;
				}
				self._id = id;
			});
		}

		this.training_schedule = new TrainingSchedule(options.training_progress);
	}

	train(q, options){
		let self = this;
		this.training_schedule.train(q, options, function(err, update_query){
			self.Model.update({_id: self._id}, update_query);
			return update_query;
		});
	}
}

class TrainingSchedule {
	constructor(options) {

		this.config = {
			MIN_EF: 1.3,
			INTERVAL_1: 1,
			INTERVAL_2: 6,
			BAD_QUALITY_CUTOFF: 3,
			PASS_CUTOFF: 4	// if scred below this value, a review session will be required
		};

		if (typeof options === 'undefined'){
			options = {};
		}

		this.utc_offset = options.utc_offset || 0;

		this.strict_mode = options.strict_mode || true;

		this.interval = options.interval || 1;

		this.EF = options.EF || 1.3;
		this.response_quality = options.response_quality || 0;
		this.init_date = options.init_date || moment().zone(this.utc_offset).startOf('day').toDate();
		this.repeat_times = options.repeat_times || 0;
		this.training_history = options.training_history || [];

		this.restarted = options.restarted || true;	// a flag when rule# 6 from the original algorithm is applied
		this.requires_review_session = options.requires_review_session || false;	// a flag for the so called "quality assessment" from the original algorithm
	}

	getNow(){
		return moment();
	}

	getToday(utc_offset) {
		utc_offset = utc_offset || this.utc_offset;
		return this.getNow().zone(utc_offset).startOf('day');
	}

	isEligibleForTraining() {
		if (!this.strict_mode){
			return true;
		}
		if ((typeof this.next_iter_scheduled === 'undefined') || this.repeat_times===0) {
			return true;
		}
		return this.getNow().isAfter(moment(this.next_iter_scheduled));
	}

	/*
	 * //review_session is a flag for the so called "quality assessment" from the original algorithm
	 * options = {in_review_session: false, utc_offset: 8} 
	 *
	**/
	train(q, options, next){
		if (typeof options === 'undefined'){
			options = {};
		}

		// update utc_offset
		this.utc_offset = options.utc_offset || this.utc_offset
		
		
		this.response_quality = q;

		this.requires_review_session = (q < this.config.PASS_CUTOFF);

		let error = '';

		let update_query = {
			$inc: {},
			$set: {},
			$push: {}
		};

		if ((!options.in_review_session) && this.isEligibleForTraining()){
			this.repeat_times++;
			update_query.$inc['training_progress.repeat_times'] = 1;
			
			// determin the interval according to http://www.supermemo.com/english/ol/sm2.htm
			if (q < this.config.BAD_QUALITY_CUTOFF || this.repeat_times===0){
				this.interval = this.config.INTERVAL_1;
				this.restarted = true;

				update_query.$set['training_progress.interval'] = this.config.INTERVAL_1;
				update_query.$set['training_progress.restarted'] = true;

			} else {
				this.EF = Math.max(this.config.MIN_EF, this.EF - 0.8+0.28*q-0.02*q*q);
				update_query.$set['training_progress.EF'] = this.EF;

				if (this.restarted && this.interval===this.config.INTERVAL_1){
					this.interval = this.config.INTERVAL_2;
					this.restarted = false;

					update_query.$set['training_progress.interval'] = this.interval;
					update_query.$set['training_progress.restarted'] = false;
	
				} else {
					this.interval = Math.round(this.interval * this.EF);
					this.restarted = false;

					update_query.$set['training_progress.interval'] = this.interval;
					update_query.$set['training_progress.restarted'] = false;
				}
			}

			this.next_iter_scheduled = this.getToday().add(this.interval, 'days').toDate();
			update_query.$set['training_progress.next_iter_scheduled'] = this.next_iter_scheduled;

		} else if (options.in_review_session){
			this.repeat_times++;
			update_query.$inc['training_progress.repeat_times'] = 1;

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
		update_query.$push['training_progress.training_history'] = training_history_record

		let query = {};
		for (let operator in update_query){
			if (_.isEmpty(update_query[operator])){
				delete update_query[operator];
			}
		}
		if (typeof next === 'function'){
			next(error, update_query);
		} else {
			return update_query;
		}
	}

	exportData() {
		let data_to_export = {
			init_date: this.init_date,
			utc_offset: this.utc_offset,
			strict_mode: this.strict_mode,
			interval: this.interval,
			EF: this.EF,
			response_quality: this.response_quality,
			repeat_times: this.repeat_times,
			training_history: this.training_history,
			restarted: this.restarted,
			requires_review_session: this.requires_review_session
		};

		return data_to_export;
	}


}

//this.SMCard = SMCard;