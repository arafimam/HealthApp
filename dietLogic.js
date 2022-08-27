//Male: 9.99 x weight in kilograms + 6.25 x height in centimeters – 4.92 x age + 5
//Female: 9.99 x weight in kilograms + 6.25 x height in centimeters – 4.92 x age – 161
// Source: https://www.livestrong.com/article/317684-how-many-calories-should-i-be-eating-for-my-height/

const getProperCalorieIntake = (weight,height,age,gender) => {
    if (gender === "Male"){
        return (9.99 * weight) + (6.25* height) - (4.92*age) + 5;
    }
    else if (gender === "Female"){
        return (9.99 * weight) + (6.25* height) - (4.92* age) -  161;
    }
    else {
        return 2000; // standard
    }

}

module.exports = {getProperCalorieIntake};