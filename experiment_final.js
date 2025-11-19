// Generate random subject code
// const subjCode = 'S' + Math.random().toString(36).substring(2, 10).toUpperCase();

// Get subject code from URL parameter (comment out line above and uncomment below)
const urlParams = new URLSearchParams(window.location.search);
const subjCode = urlParams.get('subjCode') || 'unknown';

// Generate random seed for reproducibility
const randomSeed = Math.floor(Math.random() * 1000000);

// Initialize jsPsych - note: we'll handle data saving manually, not in on_finish
const jsPsych = initJsPsych({
    on_finish: function() {
        // Data already saved, just show thank you message
        document.body.innerHTML = `
            <div style="text-align: center; margin-top: 100px; font-size: 20px;">
                <h2>Thank you!</h2>
                <p>You have completed the experiment.</p>
                <p>You may now close this window.</p>
            </div>
        `;
    }
});

// Function to save data to OSF via DataPipe
function saveDataToOSF(filename) {
    // Get only the main trial data (category and explanation trials)
    const main_data = jsPsych.data.get().filter({save_trial: true});
    
    // Manually build CSV with only the columns we want
    const rows = main_data.values();
    const headers = ['subjCode', 'randomSeed', 'rt', 'trial_type', 'word1', 'word2', 'word3', 'word4', 
                     'group_id', 'category_response', 'difficulty', 'consensus', 'trial_index', 
                     'explained_trial_index', 'time_elapsed'];
    
    let csv = headers.join(',') + '\n';
    
    rows.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];
            // Handle undefined/null values
            if (value === undefined || value === null) {
                value = '';
            }
            // Escape quotes and wrap in quotes if contains comma or quote
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
        });
        csv += values.join(',') + '\n';
    });
    
    return fetch('https://pipe.jspsych.org/api/data/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            experimentID: 'hsHLNdmy3RRN', 
            filename: filename,
            data: csv
        })
    }).then(response => {
        if (response.ok) {
            console.log('Data saved successfully to OSF');
            return true;
        } else {
            console.error('Failed to save data to OSF');
            console.log('Data that failed to save:', csv);
            return false;
        }
    }).catch(error => {
        console.error('Error saving data to OSF:', error);
        console.log('Data that failed to save:', csv);
        return false;
    });
}

// Seeded random number generator for reproducibility
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    
    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
    
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}

// Global variables
let timeline = [];
let trials_data = [];
let stored_categories = {};
let stored_trial_data = {}; // Store all trial data for later use
let rng = new SeededRandom(randomSeed);

// Add subject code and seed to all data
jsPsych.data.addProperties({
    subjCode: subjCode,
    randomSeed: randomSeed
});

// Function to load CSV file
async function loadTrialsFromCSV(filename) {
    try {
        const response = await fetch(filename);
        const csvText = await response.text();
        
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Find the group_id column index
        const group_id_index = headers.indexOf('group_id');
        
        const trials = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 4 && values.slice(0, 4).every(v => v.length > 0)) {
                // Randomize word order within trial using seeded RNG
                const words = [values[0], values[1], values[2], values[3]];
                const shuffled_words = rng.shuffle(words);
                
                trials.push({
                    word1: shuffled_words[0],
                    word2: shuffled_words[1],
                    word3: shuffled_words[2],
                    word4: shuffled_words[3],
                    group_id: group_id_index >= 0 ? values[group_id_index] : ''
                });
            }
        }
        
        // Randomize trial order using seeded RNG
        const shuffled_trials = rng.shuffle(trials);
        
        // NOW assign trial_index based on presentation order (1-indexed)
        shuffled_trials.forEach((trial, idx) => {
            trial.trial_index = idx + 1;
        });
        
        return shuffled_trials;
    } catch (error) {
        console.error('Error loading CSV:', error);
        alert('Error loading trials file. Please make sure the CSV file is in the same directory.');
        return [];
    }
}

// Instructions pages
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

const instructions_2 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div class="instruction-text">
            <h2>Examples of Good and Bad Categories</h2>
            
            <div class="example-box bad-example">
                <h3 style="color: #f44336;"> Less Good Category Example 1</h3>
                <p><strong>Words:</strong> shoe, trowel, rope, lantern</p>
                <p><strong>Category:</strong> "Things you can use as a doorstop"</p>
                <p><strong>Why it's less good:</strong> This category is broad and vague. You could use 
                almost anything as a doorstop, so this doesn't create a meaningful connection between 
                these specific items. This sort of answer can be a last resort if you cannot think of anything else that connects these things.</p>
            </div>

            <div class="example-box bad-example">
                <h3 style="color: #f44336;"> Less Good Category Example 2</h3>
                <p><strong>Words:</strong> shoe, trowel, rope, lantern</p>
                <p><strong>Category:</strong> "When you walk along the road with your shoe on your foot, a rope on your back, a trowel in your pocket, and a lantern in your hand."</p>
                <p><strong>Why it's less good:</strong> This category just puts the words in a sentence together. This is not specific and does not connect the items in a meaningful way.</p>
            </div>

            <div class="example-box good-example">
                <h3 style="color: #4CAF50;">âœ“ Good Category Example 1</h3>
                <p><strong>Words:</strong> shoe, trowel, rope, lantern</p>
                <p><strong>Category:</strong> "Things that might get lost during a camping trip"</p>
                <p><strong>Why it's good:</strong> This category is specific and creates a meaningful 
                context that connects these particular items in a natural way.</p>
            </div>

            <div class="example-box good-example">
                <h3 style="color: #4CAF50;">âœ“ Good Category Example 2</h3>
                <p><strong>Words:</strong> apple, orange, cheese, yogurt</p>
                <p><strong>Category:</strong> "Snacks you might find in a child's lunch box"</p>
                <p><strong>Why it's good:</strong> This category creates a meaningful 
                context that connects these particular items in a natural way.</p>
            </div>
            
            <p><strong>Remember:</strong> Think of categories that are specific and meaningful, 
            not overly broad, generic, or meaningless.</p>
        </div>
    `,
    choices: ['Next']
};

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
function createTrialSequence(trial_data, should_store_category = false) {
    const word_display = `
        <div class="word-display">
            ${trial_data.word1}<br>
            ${trial_data.word2}<br>
            ${trial_data.word3}<br>
            ${trial_data.word4}
        </div>
    `;
    
    // Object to collect all responses for this trial
    const trial_responses = {
        word1: trial_data.word1,
        word2: trial_data.word2,
        word3: trial_data.word3,
        word4: trial_data.word4,
        group_id: trial_data.group_id,
        trial_index: trial_data.trial_index
    };
    
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
        on_finish: function(data) {
            trial_responses.category_response = data.response.category;
            trial_responses.category_rt = data.rt;
            
            // Store for explanation phase if needed
            if (should_store_category) {
                stored_categories[trial_data.trial_index] = data.response.category;
            }
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
        on_finish: function(data) {
            trial_responses.difficulty = data.response.difficulty;
        }
    };
    
    // Consensus rating - this is the last one, so we save the consolidated data here
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
        on_finish: function(data) {
            trial_responses.consensus = data.response.consensus;
            
            // Now we have all three responses - save consolidated data
            jsPsych.data.addDataToLastTrial({
                save_trial: true,
                trial_type: 'category',
                word1: trial_responses.word1,
                word2: trial_responses.word2,
                word3: trial_responses.word3,
                word4: trial_responses.word4,
                group_id: trial_responses.group_id,
                category_response: trial_responses.category_response,
                difficulty: trial_responses.difficulty,
                consensus: trial_responses.consensus,
                trial_index: trial_responses.trial_index,
                rt: trial_responses.category_rt
            });
            
            // Store for explanation phase if needed
            if (should_store_category) {
                stored_trial_data[trial_data.trial_index] = {
                    word1: trial_responses.word1,
                    word2: trial_responses.word2,
                    word3: trial_responses.word3,
                    word4: trial_responses.word4,
                    group_id: trial_responses.group_id,
                    category_response: trial_responses.category_response
                };
            }
        }
    };
    
    return [category_input, difficulty_rating, consensus_rating];
}

// Function to create explanation trials
function createExplanationTrials(selected_indices, starting_trial_index) {
    const explanation_trials = [];
    
    const explanation_intro = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="instruction-text">
                <h2>Final Questions</h2>
                <p>We'd like to understand more about how you came up with some of your categories.</p>
                <p>We've randomly selected ${selected_indices.length} of your responses. For each one, 
                please explain your reasoning.</p>
            </div>
        `,
        choices: ['Continue']
    };
    
    explanation_trials.push(explanation_intro);
    
    selected_indices.forEach((trial_idx, count) => {
        const trial_data = trials_data[trial_idx];
        const explanation_trial_index = starting_trial_index + count;
        
        const explanation_trial = {
            type: jsPsychSurveyText,
            questions: [
                {
                    prompt: function() {
                        const stored_category = stored_categories[trial_data.trial_index] || 'NO CATEGORY FOUND';
                        
                        return `
                            <div class="word-display">
                                ${trial_data.word1}<br>
                                ${trial_data.word2}<br>
                                ${trial_data.word3}<br>
                                ${trial_data.word4}
                            </div>
                            <p>You categorized these words as: <strong>"${stored_category}"</strong></p>
                            <p>Please explain how you came up with this category. What was your thought process?</p>
                        `;
                    },
                    name: 'explanation',
                    required: true,
                    rows: 5
                }
            ],
            on_finish: function(data) {
                const stored = stored_trial_data[trial_data.trial_index];
                
                // Add all required columns
                data.save_trial = true;
                data.trial_type = 'explanation';
                data.word1 = stored.word1;
                data.word2 = stored.word2;
                data.word3 = stored.word3;
                data.word4 = stored.word4;
                data.group_id = stored.group_id;
                data.category_response = data.response.explanation; // The explanation text
                data.trial_index = explanation_trial_index; // Continue numbering from category trials
                data.explained_trial_index = trial_data.trial_index; // Which category trial this explains
                // rt and time_elapsed are automatically added by jsPsych
            }
        };
        
        explanation_trials.push(explanation_trial);
    });
    
    return explanation_trials;
}

// Main function to run the experiment
async function runExperiment() {
    // Load trials from CSV
    trials_data = await loadTrialsFromCSV('demo_sample.csv');
    
    if (trials_data.length === 0) {
        alert('No trials loaded. Please check your CSV file.');
        return;
    }
    
    // Pre-select trials for explanation
    const num_explanations = Math.min(5, trials_data.length);
    const selected_indices = [];
    
    while (selected_indices.length < num_explanations) {
        const random_index = Math.floor(rng.random() * trials_data.length);
        if (!selected_indices.includes(random_index)) {
            selected_indices.push(random_index);
        }
    }
    
    console.log('Pre-selected trials for explanation:', selected_indices);
    console.log('Subject code:', subjCode);
    console.log('Random seed:', randomSeed);
    
    // Build timeline
    timeline.push(instructions_1);
    timeline.push(instructions_2);
    timeline.push(instructions_3);
    
    // Add all trial sequences
    trials_data.forEach((trial, idx) => {
        const should_store = selected_indices.includes(idx);
        const trial_sequence = createTrialSequence(trial, should_store);
        timeline.push(...trial_sequence);
    });
    
    // Calculate starting trial_index for explanation trials (continue from category trials)
    const max_trial_index = Math.max(...trials_data.map(t => t.trial_index));
    
    // Add explanation trials
    const explanation_trials = createExplanationTrials(selected_indices, max_trial_index + 1);
    timeline.push(...explanation_trials);
    
    // Save data trial - this happens BEFORE the thank you message
    const save_data_trial = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div style="text-align: center; margin-top: 100px; font-size: 24px;">
                <h2>Saving your data...</h2>
                <p style="color: red; font-weight: bold;">DO NOT LEAVE THIS WINDOW</p>
                <p>Please wait while we save your responses.</p>
            </div>
        `,
        choices: [],
        trial_duration: 5000, // Give 5 seconds for the save to complete
        on_start: function() {
            // Trigger the save immediately when trial starts
            const filename = `${subjCode}.csv`;
            saveDataToOSF(filename).then(success => {
                if (success) {
                    console.log('Data saved successfully');
                    // End the trial early since save completed
                    jsPsych.finishTrial();
                } else {
                    console.log('Data save had an error');
                    // Still end the trial after showing error in console
                    setTimeout(() => jsPsych.finishTrial(), 2000);
                }
            });
        }
    };
    timeline.push(save_data_trial);
    
    // Redirect message - shown for 2 seconds before redirecting to Qualtrics
    const redirect_message = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div style="text-align: center; margin-top: 100px; font-size: 20px;">
                <h2>You will now be directed to the last stage of the study.</h2>
                <p>Please do not leave the study until you have completed all stages.</p>
            </div>
        `,
        choices: [],
        trial_duration: 2000,
        on_finish: function() {
            // Redirect to Qualtrics survey
            window.location.href = `https://uwmadison.co1.qualtrics.com/jfe/form/SV_0AO3OVKKPqmQaBU?subjCode=${subjCode}`;;
        }
    };
    timeline.push(redirect_message);
    
    // Run the experiment
    jsPsych.run(timeline);
}

// Start the experiment when page loads
runExperiment();


// https://uwmadison.co1.qualtrics.com/jfe/form/SV_0AO3OVKKPqmQaBU

