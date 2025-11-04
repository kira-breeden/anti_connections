// Initialize jsPsych with DataPipe for OSF saving
const jsPsych = initJsPsych({
    on_finish: function() {
        // Save data to OSF via DataPipe
        const subject_id = jsPsych.data.get().values()[0].subject_id || 'unknown';
        const filename = `${subject_id}.csv`;
        
        saveDataToOSF(filename);
    }
});

// Function to save data to OSF via DataPipe
function saveDataToOSF(filename) {
    const data = jsPsych.data.get().csv();
    
    fetch('https://pipe.jspsych.org/api/data/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            experimentID: 'hsHLNdmy3RRN', 
            filename: filename,
            data: data
        })
    }).then(response => {
        if (response.ok) {
            console.log('Data saved successfully');
            // Display completion message
            document.body.innerHTML = `
                <div style="text-align: center; margin-top: 100px; font-size: 20px;">
                    <h2>Thank you!</h2>
                    <p>Your data has been saved successfully.</p>
                    <p>You may now close this window.</p>
                </div>
            `;
        } else {
            console.error('Failed to save data');
            // Fallback: display data on screen
            jsPsych.data.displayData();
        }
    }).catch(error => {
        console.error('Error saving data:', error);
        // Fallback: display data on screen
        jsPsych.data.displayData();
    });
}

// Global variables
let timeline = [];
let trials_data = [];
let selected_trials_for_explanation = [];

// Generate a unique subject ID
const subject_id = jsPsych.randomization.randomID(10);
jsPsych.data.addProperties({
    subject_id: subject_id
});

// Function to load CSV file
async function loadTrialsFromCSV(filename) {
    try {
        const response = await fetch(filename);
        const csvText = await response.text();
        
        // Parse CSV
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const trials = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length === 4 && values.every(v => v.length > 0)) {
                trials.push({
                    word1: values[0],
                    word2: values[1],
                    word3: values[2],
                    word4: values[3],
                    trial_index: i - 1
                });
            }
        }
        
        return trials;
    } catch (error) {
        console.error('Error loading CSV:', error);
        alert('Error loading trials file. Please make sure trials.csv is in the same directory.');
        return [];
    }
}

// Instructions page 1
const instructions_1 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div class="instruction-text">
            <h2>Welcome to the Category Generation Study</h2>
            <p>In this experiment, you will see sets of four words. Your task is to create a category 
            that links all four words together in a meaningful way.</p>
            
            <p>The key is to think of categories that are <strong>meaningful</strong>, 
            not categories that are so broad they could apply to almost anything.</p>
            
            <p>Click "Next" to see some examples.</p>
        </div>
    `,
    choices: ['Next']
};

// Instructions page 2 - Examples
const instructions_2 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div class="instruction-text">
            <h2>Examples of Good and Bad Categories</h2>
            
            <div class="example-box bad-example">
                <h3 style="color: #f44336;"> Less Good Category Example</h3>
                <p><strong>Words:</strong> shoe, trowel, rope, lantern</p>
                <p><strong>Category:</strong> "Things you can use as a doorstop"</p>
                <p><strong>Why it's less good:</strong> This category is broad and vague. You could use 
                almost anything as a doorstop, so this doesn't create a meaningful connection between 
                these specific items. This sort of answer can be a last resort if you cannot think of anything else that connects these things.</p>
            </div>
            
            <div class="example-box good-example">
                <h3 style="color: #4CAF50;">✓ Good Category Example</h3>
                <p><strong>Words:</strong> shoe, trowel, rope, lantern</p>
                <p><strong>Category:</strong> "Things that might get lost during a camping trip"</p>
                <p><strong>Why it's good:</strong> This category is specific and creates a meaningful 
                context that connects these particular items in a natural way.</p>
            </div>
            
            <p><strong>Remember:</strong> Think of categories that are specific and meaningful, 
            not overly broad or generic.</p>
        </div>
    `,
    choices: ['Next']
};

// Instructions page 3 - Task overview
const instructions_3 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div class="instruction-text">
            <h2>What You'll Do</h2>
            
            <p>For each set of four words, you will:</p>
            <ol>
                <li>Type in a category that links all four words together</li>
                <li>Rate how difficult it was to come up with the category</li>
                <li>Rate how likely you think someone else would be to generate the same category</li>
            </ol>
            
            <p>At the end, we'll ask you to explain your reasoning for a few randomly selected trials.</p>
            
            <p>Take your time and think carefully about meaningful connections between the words.</p>
            
            <p>Click "Start Experiment" when you're ready to begin.</p>
        </div>
    `,
    choices: ['Start Experiment']
};

// Function to create a trial sequence
function createTrialSequence(trial_data) {
    const word_display = `
        <div class="word-display">
            ${trial_data.word1}<br>
            ${trial_data.word2}<br>
            ${trial_data.word3}<br>
            ${trial_data.word4}
        </div>
    `;
    
    // Category input
    const category_input = {
        type: jsPsychSurveyText,
        questions: [
            {
                prompt: word_display + '<p>What category links these four words together?</p>',
                name: 'category',
                required: true,
                rows: 3
            }
        ],
        data: {
            trial_type: 'category_input',
            words: [trial_data.word1, trial_data.word2, trial_data.word3, trial_data.word4],
            trial_index: trial_data.trial_index
        }
    };
    
    // Difficulty rating
    const difficulty_rating = {
        type: jsPsychSurveyLikert,
        questions: [
            {
                prompt: "How difficult was it to come up with this category?",
                name: 'difficulty',
                labels: [
                    "Very Easy",
                    "Somewhat Easy",
                    "Neutral",
                    "Somewhat Difficult",
                    "Very Difficult"
                ],
                required: true
            }
        ],
        data: {
            trial_type: 'difficulty_rating',
            words: [trial_data.word1, trial_data.word2, trial_data.word3, trial_data.word4],
            trial_index: trial_data.trial_index
        }
    };
    
    // Consensus rating
    const consensus_rating = {
        type: jsPsychSurveyLikert,
        questions: [
            {
                prompt: "How likely do you think someone else would be to generate the same category?",
                name: 'consensus',
                labels: [
                    "Very Unlikely",
                    "Somewhat Unlikely",
                    "Neutral",
                    "Somewhat Likely",
                    "Very Likely"
                ],
                required: true
            }
        ],
        data: {
            trial_type: 'consensus_rating',
            words: [trial_data.word1, trial_data.word2, trial_data.word3, trial_data.word4],
            trial_index: trial_data.trial_index
        }
    };
    
    return [category_input, difficulty_rating, consensus_rating];
}

// Function to create explanation trials for randomly selected trials
function createExplanationTrials(num_trials = 3) {
    // Randomly select trials
    const num_to_select = Math.min(num_trials, trials_data.length);
    const selected_indices = [];
    
    while (selected_indices.length < num_to_select) {
        const random_index = Math.floor(Math.random() * trials_data.length);
        if (!selected_indices.includes(random_index)) {
            selected_indices.push(random_index);
        }
    }
    
    selected_trials_for_explanation = selected_indices;
    
    const explanation_trials = [];
    
    // Introduction to explanation section
    const explanation_intro = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="instruction-text">
                <h2>Final Questions</h2>
                <p>We'd like to understand more about how you came up with some of your categories.</p>
                <p>We've randomly selected ${num_to_select} of your responses. For each one, 
                please explain your reasoning.</p>
            </div>
        `,
        choices: ['Continue']
    };
    
    explanation_trials.push(explanation_intro);
    
    // Get the actual data for selected trials
    selected_indices.forEach((trial_idx, count) => {
        const trial_data = trials_data[trial_idx];
        
        // Get the participant's category response for this trial
        const category_response_getter = {
            type: jsPsychSurveyText,
            questions: [
                {
                    prompt: function() {
                        // Find the category response from the data at runtime
                        const all_data = jsPsych.data.get().filter({
                            trial_type: 'category_input',
                            trial_index: trial_data.trial_index
                        }).values();
                        
                        let category_text = 'NO CATEGORY FOUND';
                        if (all_data.length > 0) {
                            category_text = all_data[0].response.category;
                        }
                        
                        return `
                            <div class="word-display">
                                ${trial_data.word1}<br>
                                ${trial_data.word2}<br>
                                ${trial_data.word3}<br>
                                ${trial_data.word4}
                            </div>
                            <p>You categorized these words as: <strong>"${category_text}"</strong></p>
                            <p>Please explain how you came up with this category. What was your thought process?</p>
                        `;
                    },
                    name: 'explanation',
                    required: true,
                    rows: 5
                }
            ],
            data: {
                trial_type: 'explanation',
                words: [trial_data.word1, trial_data.word2, trial_data.word3, trial_data.word4],
                trial_index: trial_data.trial_index,
                explanation_number: count + 1
            }
        };
        
        explanation_trials.push(category_response_getter);
    });
    
    return explanation_trials;
}

// Main function to run the experiment
async function runExperiment() {
    // Load trials from CSV
    trials_data = await loadTrialsFromCSV('trials.csv');
    
    if (trials_data.length === 0) {
        alert('No trials loaded. Please check your trials.csv file.');
        return;
    }
    
    // Add instructions to timeline
    timeline.push(instructions_1);
    timeline.push(instructions_2);
    timeline.push(instructions_3);
    
    // Add all trial sequences
    trials_data.forEach(trial => {
        const trial_sequence = createTrialSequence(trial);
        timeline.push(...trial_sequence);
    });
    
    // Add explanation trials (randomly select 3 trials, or fewer if there are fewer trials)
    const num_explanations = Math.min(5, trials_data.length); // TO DO: Ask Aja how many we think we should ask about 
    const explanation_trials = createExplanationTrials(num_explanations);
    timeline.push(...explanation_trials);
    
    // Thank you message
    const thank_you = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="instruction-text">
                <h2>Thank You!</h2>
                <p>You have completed the experiment.</p>
                <p>Your responses have been recorded.</p>
            </div>
        `,
        choices: ['Finish']
    };
    timeline.push(thank_you);
    
    // Run the experiment
    jsPsych.run(timeline);
}

// Start the experiment when page loads
runExperiment();
