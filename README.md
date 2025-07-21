# Share Karo - Temporary File Transfer Service
https://www.sharekaro.site/

A lightweight file sharing application that allows users to upload files and share them via a 6-digit code. Files are automatically deleted after 3 minutes for security and storage optimization.

## Features

- Simple drag-and-drop file upload
- 6-digit code generation for easy file sharing
- Automatic file deletion after 3 minutes
- Easy file download using access code
- Manual file deletion option

## Technologies Used

- Node.js & Express
- MongoDB with GridFS for file storage
- Mongoose for MongoDB object modeling
- express-fileupload for handling file uploads

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Seamless-Share.git
   cd Share Karo
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your MongoDB connection string:
   ```
   MONGO_URI=mongodb://localhost:27017/Share Karo
   PORT=5000
   ```

4. Start the server:
   ```
   npm start
   ```

5. Access the application at `http://localhost:5000`

## Environment Variables

- `MONGO_URI`: MongoDB connection string
- `PORT`: Port on which the server will run (defaults to 5000)

## Usage

1. Upload a file using the web interface
2. Share the 6-digit code with the recipient
3. Recipient enters the code to download the file
4. Files are automatically deleted after 3 minutes


## Author
Parv Sheth
Sidharth Maharana
Saee Tarde
