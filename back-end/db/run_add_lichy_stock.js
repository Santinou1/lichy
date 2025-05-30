const fs = require('fs');
const path = require('path');
const pool = require('../db/dbconfig');

async function runSqlScript() {
  try {
    console.log('Executing SQL script to add "Lichy En stock" location...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'add_lichy_stock_location.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .filter(statement => statement.trim() !== '')
      .map(statement => statement.trim() + ';');
    
    // Execute each statement
    const connection = await pool.promise();
    
    for (const statement of statements) {
      if (statement.trim() !== ';') {
        console.log(`Executing: ${statement}`);
        const [results] = await connection.query(statement);
        
        // If it's a SELECT statement, log the results
        if (statement.toLowerCase().includes('select')) {
          console.log('Results:', JSON.stringify(results, null, 2));
        } else {
          console.log('Statement executed successfully');
        }
      }
    }
    
    console.log('SQL script execution completed successfully');
  } catch (error) {
    console.error('Error executing SQL script:', error);
  } finally {
    // Don't end the pool here as it might be used elsewhere in the application
    console.log('Script execution finished');
  }
}

// Run the script
runSqlScript();
