class ModelExecutor {
    initialized = false;
    core = null;
    model = null;
    compiledModel = null;
    ir1 = null;
    ir2 = null;
    modelFilePath = null;
    lastUsedDevice = null;

    nextInferRequestNum = 1;

    constructor(ov, modelFilePath) {
        this.core = new ov.Core();
        this.modelFilePath = modelFilePath;
    }

    async init() {
        this.model = await this.core.readModel(this.modelFilePath);
        this.initialized = true;
    }

    async compileModel(device = 'AUTO') {
        this.compiledModel = await this.core.compileModel(
            this.model, device,
            {
              'PERFORMANCE_HINT': 'THROUGHPUT',
              //'NUM_STREAMS': 2 // 2 is for CPU, GPU usually fails, remove for GPU
            },
        );
        this.lastUsedDevice = device;

        return this.compiledModel;
    }

    async execute(device, inputData) {
        const useTwoInferRequests = true; // Can fail on GPU

        if (!this.initialized)
            throw new Error('Model isn\'t initialized');

        if (!this.compiledModel || device !== this.lastUsedDevice) {
            await this.compileModel(device);
            this.ir1 = await this.compiledModel.createInferRequest();

            if (useTwoInferRequests)
              this.ir2 = await this.compiledModel.createInferRequest();
        }

        const result = await this.getInferRequest(useTwoInferRequests).inferAsync(inputData);
        const keys = Object.keys(result);

        return result[keys[0]];
    }

    getInferRequest(useTwo = false) {
      if (!useTwo) return this.ir1;

      switch(this.nextInferRequestNum) {
        case 1:
          this.nextInferRequestNum = 2;
          return this.ir1;
        case 2:
          this.nextInferRequestNum = 1;
          return this.ir2;
      }
    }
}

module.exports = ModelExecutor;