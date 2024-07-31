import sm_tc
import os
import datetime

def process_file(filename):
    # Specify the directory where you want to write the file
    directory = '../data'

    # Create the directory if it doesn't exist
    if not os.path.exists(directory):
        os.makedirs(directory)

    # Specify the filename and the directory to write to
    file_path = os.path.join(directory, filename)

    with open(filename, 'a') as file:
        # Perform some arithmetic and return 8 values
        result = [1, 2, 3, 4, 5, 6, 7, 8]   
        # Get the current timestamp
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        t = sm_tc.SMtc(0)
        result = str(timestamp) + ","
        for i in range(8):
            if(i != 7):
                result += str(t.get_temp(i + 1)) + ","
            else:
                result += str(t.get_temp(i + 1)) + "\n"
        # Write the result to the file
        file.write(str(result))
        return result

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python script.py <filename>")
        sys.exit(1)

    filename = sys.argv[1]
    result = process_file(filename)
    print(f"{result}")
    
