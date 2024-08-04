import os
import datetime

def process_file(filename, t1, t2, t3, t4, t5, t6, t7, t8):
    # Specify the directory where you want to write the file
    directory = '../data'

    # Create the directory if it doesn't exist
    if not os.path.exists(directory):
        os.makedirs(directory)

    # Specify the filename and the directory to write to
    file_path = os.path.join(directory, filename)

    with open(filename, 'a') as file:
        result = "timestamp," + t1 + "," + t2 + "," + t3 + "," + t4 + "," + t5 + "," + t6 + "," + t7 + "," + t8 + "\n"
        # Write the result to the file
        file.write(str(result))
        return result

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 10:
        print("Usage: python script.py <filename>")
        sys.exit(1)

    filename = sys.argv[1]
    t1 = sys.argv[2]
    t2 = sys.argv[3]
    t3 = sys.argv[4]
    t4 = sys.argv[5]
    t5 = sys.argv[6]
    t6 = sys.argv[7]
    t7 = sys.argv[8]
    t8 = sys.argv[9]
    result = process_file(filename, t1, t2, t3, t4, t5, t6, t7, t8)
    print(f"{result}")
