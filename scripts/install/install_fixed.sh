#!/bin/bash
set -e

print_header() {
    echo -e "\n\033[1;34m==> $1\033[0m\n"
}

print_info() {
    echo -e "\033[1;36mℹ $1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✓ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠ $1\033[0m"
}

install_nodejs() {
    print_header "Instalando Node.js via NVM"
    
    if [ -n "$SUDO_USER" ]; then
        REAL_USER=$SUDO_USER
    else
        REAL_USER=$(whoami)
    fi

    REAL_HOME=$(eval echo ~$REAL_USER)

    if [ ! -d "$REAL_HOME/.nvm" ]; then
        print_info "Instalando NVM..."
        sudo -u $REAL_USER bash -ic 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash'
        print_success "NVM instalado"
    else
        print_warning "NVM já está instalado"
    fi

    print_info "Instalando Node.js LTS..."
    sudo -u $REAL_USER bash -ic '
        export NVM_DIR="$HOME/.nvm"
        source "$NVM_DIR/nvm.sh"
        nvm install --lts
        nvm alias default lts/*
        nvm use default
        node -v && npm -v
    '

    print_success "Node.js instalado via NVM"
}

main() {
    print_header "Iniciando instalação completa"
    install_nodejs
    print_success "Instalação concluída com sucesso!"
}

main "$@"
