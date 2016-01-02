#include<iostream>
#include<vector>
#include<map>

int main() {
    std::vector<int> a;
    int hoge;
    std::cin >> hoge;
    a.push_back(hoge);
    for (int i = 0; i < a.size(); i++) {
        a[i] = 0;
    }
    std::map<int, int> mp;
    for (std::map<int, int>::const_iterator it = mp.begin(); it != mp.end(); ++it) {
        std::cout << it->first << ' ' << it->second << std::endl;
    }
    std::printf("Hello, %s\n", "world");
}
