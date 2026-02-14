/**
 * Custom Playwright Reporter - Verbose Console Output
 *
 * Shows for each test:
 * - Test number / total
 * - Description of what it tests
 * - Phases (from console.log markers in tests)
 */

class VerboseReporter {
  constructor() {
    this.totalTests = 0;
    this.currentTestNumber = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;
    this.startTime = null;
  }

  onBegin(config, suite) {
    this.totalTests = suite.allTests().length;
    this.startTime = Date.now();

    console.log('\n══════════════════════════════════════════════');
    console.log(` E2E TEST SUITE - ${this.totalTests} tests`);
    console.log('══════════════════════════════════════════════\n');
  }

  onTestBegin(test) {
    this.currentTestNumber++;
    const suiteName = test.parent?.title || '';
    const testTitle = test.title;

    console.log(`\n┌─────────────────────────────────────────────`);
    console.log(`│ Test ${this.currentTestNumber}/${this.totalTests}: ${testTitle}`);
    if (suiteName) {
      console.log(`│ Suite: ${suiteName}`);
    }
    console.log(`│ File: ${test.location.file.split('/').pop()}:${test.location.line}`);
    console.log(`└─────────────────────────────────────────────`);
  }

  onTestEnd(test, result) {
    const duration = (result.duration / 1000).toFixed(1);
    const status = result.status;

    if (status === 'passed') {
      this.passedTests++;
      console.log(`  => PASSED (${duration}s)`);
    } else if (status === 'failed') {
      this.failedTests++;
      console.log(`  => FAILED (${duration}s)`);
      if (result.errors?.length) {
        for (const error of result.errors) {
          const message = error.message?.split('\n')[0] || 'Unknown error';
          console.log(`     Error: ${message}`);
        }
      }
    } else if (status === 'skipped') {
      this.skippedTests++;
      console.log(`  => SKIPPED`);
    } else if (status === 'timedOut') {
      this.failedTests++;
      console.log(`  => TIMEOUT (${duration}s)`);
    }
  }

  onStdOut(chunk, test) {
    // Forward test console.log output with indentation
    const lines = chunk.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`  ${line}`);
      }
    }
  }

  onEnd(result) {
    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(1);

    console.log('\n══════════════════════════════════════════════');
    console.log(` RESULTS: ${this.passedTests} passed, ${this.failedTests} failed, ${this.skippedTests} skipped`);
    console.log(` Total time: ${totalDuration}s`);
    console.log('══════════════════════════════════════════════\n');
  }
}

export default VerboseReporter;
