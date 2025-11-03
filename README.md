# Category Generation Experiment

This is a jsPsych experiment where participants generate categories for sets of four words.

## Files

- **experiment.html** - Main HTML file to run the experiment
- **experiment.js** - JavaScript code containing the experiment logic
- **trials.csv** - CSV file containing the word sets for each trial

## How to Use

### Setup DataPipe for OSF Integration

1. Go to https://pipe.jspsych.org/
2. Create a new experiment and get your experiment ID
3. In experiment.js, replace `'YOUR_EXPERIMENT_ID_HERE'` with your actual experiment ID:
   ```javascript
   experimentID: 'YOUR_EXPERIMENT_ID_HERE', // Replace with your DataPipe experiment ID
   ```
4. Follow DataPipe instructions to link your OSF project

### Running the Experiment

1. Place all three files (experiment.html, experiment.js, trials.csv) in the same directory
2. Host the files on a web server (DataPipe requires the experiment to be served via HTTP/HTTPS, not opened as a local file)
3. Participants open the experiment.html URL
4. Data will automatically be saved to your OSF project via DataPipe

## CSV Format

The trials.csv file should have the following format:
```
word1,word2,word3,word4
shoe,trowel,rope,lantern
apple,orange,banana,grape
...
```

- First row contains headers (word1, word2, word3, word4)
- Each subsequent row contains four words for one trial
- Words should be comma-separated with no extra spaces

## Experiment Flow

1. **Instructions** - Three pages of instructions including:
   - Welcome and task overview
   - Examples of good vs. bad categories
   - What participants will do

2. **Main Trials** - For each set of four words:
   - Participant types a category linking the words
   - Rates difficulty (7-point scale)
   - Rates consensus likelihood (7-point scale)

3. **Explanation Phase** - Randomly selects a subset of trials (default: 3) and asks:
   - How did you come up with this category?

4. **Completion** - Thank you message and data display

## Customization

### Number of Explanation Trials
To change how many trials get the explanation question, modify this line in experiment.js:
```javascript
const num_explanations = Math.min(3, trials_data.length);
```
Change the `3` to your desired number.

### Rating Scales
The difficulty and consensus ratings use 7-point Likert scales. You can modify the labels in the `createTrialSequence` function.

### Styling
CSS styles are embedded in the experiment.html file and can be modified in the `<style>` section.

## Data Output

The experiment automatically saves data to your OSF project via DataPipe. Each participant's data is saved as a separate CSV file named with their unique subject ID (e.g., `a1b2c3d4e5.csv`).

The data includes:
- **subject_id** - Unique identifier for each participant
- **Category responses** - The category text for each trial
- **Difficulty ratings** - 1-7 scale
- **Consensus ratings** - 1-7 scale
- **Explanations** - Free text for randomly selected trials
- **Trial metadata** - Words used, trial index, response times, etc.

If data saving fails (e.g., network issues), the data will be displayed on screen as a fallback.

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (to load jsPsych from CDN and save data to OSF)
- Web server to host the files (GitHub Pages, OSF hosting, or local server)
- DataPipe account and experiment ID (get from https://pipe.jspsych.org/)
- All files must be in the same directory

## Notes

- The experiment uses jsPsych 7.3.4 loaded from CDN
- Trials are loaded asynchronously from the CSV file
- The explanation phase randomly selects trials after all main trials are complete
- All responses are required before participants can continue
