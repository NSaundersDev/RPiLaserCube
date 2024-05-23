#include <wiringPi.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <string.h>
#include <sys/ioctl.h>
#include <linux/i2c-dev.h>

#define THERMOCOUPLE_I2C_ADDR 0x3F
#define THERMOCOUPLE_CHANNELS 8

// Function to convert a 12-bit signed ADC value to a temperature in degrees Celsius
float convertTemp(int16_t adcValue) {
    return (float)adcValue / 4096.0 * 5.0 * 100.0;
}

// Function to read the ADC value from the I2C device
int16_t readAdcValue(int i2cFile, uint8_t channel) {
    uint8_t buffer[2];
    buffer[0] = channel;

    if (write(i2cFile, buffer, 1) != 1) {
        printf("Error: Could not write to I2C device.\n");
        return -1;
    }

    if (read(i2cFile, buffer, 2) != 2) {
        printf("Error: Could not read from I2C device.\n");
        return -1;
    }

    return (buffer[0] << 8) | buffer[1];
}

int main() {
    int i2cFile;
    int16_t adcValue;
    uint8_t channel;

    // Initialize wiringPi library
    wiringPiSetup();

    // Open the I2C device file
    if ((i2cFile = open("/dev/i2c-1", O_RDWR)) < 0) {
        printf("Error: Could not open I2C device file.\n");
        return 1;
    }

    // Set the I2C address for the Sequent Microsystems HAT
    if (ioctl(i2cFile, I2C_SLAVE, THERMOCOUPLE_I2C_ADDR) < 0) {
        printf("Error: Could not set I2C address.\n");
        return 1;
    }

    // Read and print the temperature for each thermocouple channel
    for (channel = 0; channel < THERMOCOUPLE_CHANNELS; channel++) {
        adcValue = readAdcValue(i2cFile, channel);
        if (adcValue != -1) {
            printf("Channel %d: %.2f°C\n", channel, convertTemp(adcValue));
        }
    }

    // Close the I2C device file
    close(i2cFile);

    return 0;
}