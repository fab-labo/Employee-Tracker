const inquirer = require("inquirer");
const { Client } = require("pg");
const consoleTable = require("console.table");
require('dotenv').config(); // For loading environment variables

// Establish database connection
const db = new Client({
    host: 'localhost',
    user: 'postgres', 
    password: 'Loscatrachos24!',
    database: 'employees_db',
    port: 5432,
});

db.connect(err => {
    if (err) {
        console.error('Connection error', err.stack);
    } else {
        console.log(`Connected to employees_db!`);
        console.log("**************************************");
        console.log("           EMPLOYEE TRACKER           ");
        console.log("**************************************");
        startYourQuery();
    }
});

// Helper function to handle database queries with async/await
async function queryDB(query, values = []) {
    try {
        const res = await db.query(query, values);
        return res.rows;
    } catch (err) {
        console.error('Error executing query', err.stack);
        throw err;
    }
}

// Start Your Query to the Database
async function startYourQuery() {
    const { intro } = await inquirer.prompt({
        type: 'list',
        name: 'intro',
        message: 'What would you like to do?',
        choices: [
            'View All Employees',
            'Add Employee',
            'Update Employee Role',
            'View All Roles',
            'Add Role',
            'View All Departments',
            'Add Department',
            'Quit'
        ]
    });

    switch (intro) {
        case 'View All Employees':
            viewEmployees();
            break;
        case 'Add Employee':
            addEmployee();
            break;
        case 'Update Employee Role':
            updateRole();
            break;
        case 'View All Roles':
            viewRoles();
            break;
        case 'Add Role':
            addRole();
            break;
        case 'View All Departments':
            showDepartments();
            break;
        case 'Add Department':
            addDepartment();
            break;
        case 'Quit':
            console.log('Goodbye!');
            db.end();
            break;
    }
}

// Function to View Departments
async function showDepartments() {
    const sql = `SELECT department.id, department.name AS Department FROM department;`;
    const departments = await queryDB(sql);
    console.table(departments);
    startYourQuery();
}

// Function to View Roles
async function viewRoles() {
    const sql = `SELECT role.id, role.title AS role, role.salary, department.name AS department 
                 FROM role 
                 INNER JOIN department ON (department.id = role.department_id);`;
    const roles = await queryDB(sql);
    console.table(roles);
    startYourQuery();
}

// Function to View Employees
async function viewEmployees() {
    const sql = `SELECT employee.id, employee.first_name, employee.last_name, role.title AS role, 
                        department.name AS department, role.salary, 
                        CONCAT(manager.first_name, ' ', manager.last_name) AS manager 
                 FROM employee 
                 LEFT JOIN employee manager ON manager.id = employee.manager_id 
                 INNER JOIN role ON role.id = employee.role_id 
                 INNER JOIN department ON department.id = role.department_id 
                 ORDER BY employee.id;`;
    const employees = await queryDB(sql);
    console.table(employees);
    startYourQuery();
}

// Function to Add A Department
async function addDepartment() {
    const { department } = await inquirer.prompt({
        type: 'input',
        name: 'department',
        message: 'What is the name of the department?',
    });

    const sql = `INSERT INTO department(name) VALUES($1);`;
    await queryDB(sql, [department]);
    console.log(`Added ${department} to the database`);
    startYourQuery();
}

// Function to Add a Role
async function addRole() {
    const departments = await queryDB(`SELECT * FROM department`);
    const departmentList = departments.map(dept => ({ name: dept.name, value: dept.id }));

    const { title, salary, department } = await inquirer.prompt([
        { type: 'input', name: 'title', message: 'What is the name of the role?' },
        { type: 'input', name: 'salary', message: 'What is the salary of the role?' },
        { type: 'list', name: 'department', message: 'Which department does the role belong to?', choices: departmentList }
    ]);

    const sql = `INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3);`;
    await queryDB(sql, [title, salary, department]);
    console.log(`Added ${title} to the database`);
    startYourQuery();
}

// Function to Add an Employee
async function addEmployee() {
    const employees = await queryDB(`SELECT * FROM employee`);
    const roles = await queryDB(`SELECT * FROM role`);

    const employeeList = employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));
    const roleList = roles.map(role => ({ name: role.title, value: role.id }));

    const { first, last, role, manager } = await inquirer.prompt([
        { type: 'input', name: 'first', message: "What is the employee's first name?" },
        { type: 'input', name: 'last', message: "What is the employee's last name?" },
        { type: 'list', name: 'role', message: "What is the employee's role?", choices: roleList },
        { type: 'list', name: 'manager', message: "Who is the employee's manager?", choices: employeeList }
    ]);

    const sql = `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4);`;
    await queryDB(sql, [first, last, role, manager]);
    console.log(`Added ${first} ${last} to the database`);
    startYourQuery();
}

// Function to Update an Employee's Role
async function updateRole() {
    const employees = await queryDB(`SELECT * FROM employee`);
    const roles = await queryDB(`SELECT * FROM role`);

    const employeeList = employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));
    const roleList = roles.map(role => ({ name: role.title, value: role.id }));

    const { employee, role } = await inquirer.prompt([
        { type: 'list', name: 'employee', message: "Which employee's role do you want to update?", choices: employeeList },
        { type: 'list', name: 'role', message: "Which role do you want to assign to the selected employee?", choices: roleList }
    ]);

    const sql = `UPDATE employee SET role_id = $1 WHERE id = $2;`;
    await queryDB(sql, [role, employee]);
    console.log("Employee role updated");
    startYourQuery();
}
